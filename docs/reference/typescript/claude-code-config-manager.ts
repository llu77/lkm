import type { CcrConfig } from '../types/ccr'
import type { ClaudeCodeConfigData, ClaudeCodeProfile, OperationResult } from '../types/claude-code-config'
import type { ZcfTomlConfig } from '../types/toml-config'
import dayjs from 'dayjs'
import { join } from 'pathe'
import { SETTINGS_FILE, ZCF_CONFIG_DIR, ZCF_CONFIG_FILE } from '../constants'
import { copyFile, ensureDir, exists } from './fs-operations'
import { readJsonConfig } from './json-config'
import { createDefaultTomlConfig, readDefaultTomlConfig, writeTomlConfig } from './zcf-config'

export class ClaudeCodeConfigManager {
  static readonly CONFIG_FILE = ZCF_CONFIG_FILE
  static readonly LEGACY_CONFIG_FILE = join(ZCF_CONFIG_DIR, 'claude-code-configs.json')

  /**
   * Ensure configuration directory exists
   */
  private static ensureConfigDir(): void {
    ensureDir(ZCF_CONFIG_DIR)
  }

  /**
   * Read TOML configuration
   */
  private static readTomlConfig(): ZcfTomlConfig | null {
    return readDefaultTomlConfig()
  }

  /**
   * Load TOML configuration, falling back to default when missing
   */
  private static loadTomlConfig(): ZcfTomlConfig {
    const existingConfig = this.readTomlConfig()
    if (existingConfig) {
      return existingConfig
    }
    return createDefaultTomlConfig()
  }

  /**
   * Migrate legacy JSON-based configuration into TOML storage
   */
  private static migrateFromLegacyConfig(): ClaudeCodeConfigData | null {
    if (!exists(this.LEGACY_CONFIG_FILE)) {
      return null
    }

    try {
      const legacyConfig = readJsonConfig<any>(this.LEGACY_CONFIG_FILE)
      if (!legacyConfig) {
        return null
      }

      const normalizedProfiles: Record<string, ClaudeCodeProfile> = {}
      const existingKeys = new Set<string>()
      let migratedCurrentKey = ''

      Object.entries(legacyConfig.profiles || {}).forEach(([legacyKey, profile]) => {
        const sourceProfile = profile as ClaudeCodeProfile
        const name = sourceProfile.name?.trim() || legacyKey
        const baseKey = this.generateProfileId(name)
        let uniqueKey = baseKey || legacyKey
        let suffix = 2
        while (existingKeys.has(uniqueKey)) {
          uniqueKey = `${baseKey || legacyKey}-${suffix++}`
        }
        existingKeys.add(uniqueKey)

        const sanitizedProfile = this.sanitizeProfile({
          ...sourceProfile,
          name,
        })

        normalizedProfiles[uniqueKey] = {
          ...sanitizedProfile,
          id: uniqueKey,
        }

        if (legacyConfig.currentProfileId === legacyKey || legacyConfig.currentProfileId === sourceProfile.id) {
          migratedCurrentKey = uniqueKey
        }
      })

      if (!migratedCurrentKey && legacyConfig.currentProfileId) {
        const fallbackKey = this.generateProfileId(legacyConfig.currentProfileId)
        if (existingKeys.has(fallbackKey)) {
          migratedCurrentKey = fallbackKey
        }
      }

      if (!migratedCurrentKey && existingKeys.size > 0) {
        migratedCurrentKey = Array.from(existingKeys)[0]
      }

      const migratedConfig: ClaudeCodeConfigData = {
        currentProfileId: migratedCurrentKey,
        profiles: normalizedProfiles,
      }

      this.writeConfig(migratedConfig)
      return migratedConfig
    }
    catch (error) {
      console.error('Failed to migrate legacy Claude Code config:', error)
      return null
    }
  }

  /**
   * Read configuration
   */
  static readConfig(): ClaudeCodeConfigData | null {
    try {
      const tomlConfig = readDefaultTomlConfig()
      if (!tomlConfig || !tomlConfig.claudeCode) {
        return this.migrateFromLegacyConfig()
      }

      const { claudeCode } = tomlConfig
      const rawProfiles = claudeCode.profiles || {}
      const sanitizedProfiles = Object.fromEntries(
        Object.entries(rawProfiles).map(([key, profile]) => {
          const storedProfile = this.sanitizeProfile({
            ...(profile as ClaudeCodeProfile),
            name: (profile as ClaudeCodeProfile).name || key,
          })
          return [key, { ...storedProfile, id: key }]
        }),
      )

      const configData: ClaudeCodeConfigData = {
        currentProfileId: claudeCode.currentProfile || '',
        profiles: sanitizedProfiles,
      }

      if (Object.keys(configData.profiles).length === 0) {
        const migrated = this.migrateFromLegacyConfig()
        if (migrated) {
          return migrated
        }
      }

      return configData
    }
    catch (error) {
      console.error('Failed to read Claude Code config:', error)
      return null
    }
  }

  /**
   * Write configuration
   */
  static writeConfig(config: ClaudeCodeConfigData): void {
    try {
      this.ensureConfigDir()

      const keyMap = new Map<string, string>()
      const sanitizedProfiles = Object.fromEntries(
        Object.entries(config.profiles).map(([key, profile]) => {
          const normalizedName = profile.name?.trim() || key
          const profileKey = this.generateProfileId(normalizedName)
          keyMap.set(key, profileKey)

          const sanitizedProfile = this.sanitizeProfile({
            ...profile,
            name: normalizedName,
          })
          return [profileKey, sanitizedProfile]
        }),
      )

      const tomlConfig = this.loadTomlConfig()
      const nextTomlConfig: ZcfTomlConfig = {
        ...tomlConfig,
        claudeCode: {
          ...tomlConfig.claudeCode,
          currentProfile: keyMap.get(config.currentProfileId) || config.currentProfileId,
          profiles: sanitizedProfiles,
        },
      }

      writeTomlConfig(this.CONFIG_FILE, nextTomlConfig)
    }
    catch (error) {
      console.error('Failed to write Claude Code config:', error)
      throw new Error(`Failed to write config: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create empty configuration
   */
  static createEmptyConfig(): ClaudeCodeConfigData {
    return {
      currentProfileId: '',
      profiles: {},
    }
  }

  /**
   * Apply profile settings to Claude Code runtime
   */
  static async applyProfileSettings(profile: ClaudeCodeProfile | null): Promise<void> {
    const { ensureI18nInitialized, i18n } = await import('../i18n')
    ensureI18nInitialized()

    try {
      if (!profile) {
        const { switchToOfficialLogin } = await import('./config')
        switchToOfficialLogin()
        return
      }

      const { readJsonConfig, writeJsonConfig } = await import('./json-config')
      const settings = readJsonConfig<any>(SETTINGS_FILE) || {}

      if (!settings.env)
        settings.env = {}

      let shouldRestartCcr = false

      if (profile.authType === 'api_key') {
        settings.env.ANTHROPIC_API_KEY = profile.apiKey
        delete settings.env.ANTHROPIC_AUTH_TOKEN
      }
      else if (profile.authType === 'auth_token') {
        settings.env.ANTHROPIC_AUTH_TOKEN = profile.apiKey
        delete settings.env.ANTHROPIC_API_KEY
      }
      else if (profile.authType === 'ccr_proxy') {
        const { readCcrConfig } = await import('./ccr/config')
        const ccrConfig = readCcrConfig()
        if (!ccrConfig) {
          throw new Error(i18n.t('ccr:ccrNotConfigured') || 'CCR proxy configuration not found')
        }

        const host = ccrConfig.HOST || '127.0.0.1'
        const port = ccrConfig.PORT || 3456
        const apiKey = ccrConfig.APIKEY || 'sk-zcf-x-ccr'

        settings.env.ANTHROPIC_BASE_URL = `http://${host}:${port}`
        settings.env.ANTHROPIC_API_KEY = apiKey
        delete settings.env.ANTHROPIC_AUTH_TOKEN
        shouldRestartCcr = true
      }

      if (profile.authType !== 'ccr_proxy') {
        if (profile.baseUrl)
          settings.env.ANTHROPIC_BASE_URL = profile.baseUrl
        else
          delete settings.env.ANTHROPIC_BASE_URL
      }

      writeJsonConfig(SETTINGS_FILE, settings)

      const { setPrimaryApiKey, addCompletedOnboarding } = await import('./claude-config')
      setPrimaryApiKey()
      addCompletedOnboarding()

      if (shouldRestartCcr) {
        const { runCcrRestart } = await import('./ccr/commands')
        await runCcrRestart()
      }
    }
    catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`${i18n.t('multi-config:failedToApplySettings')}: ${reason}`)
    }
  }

  static async applyCurrentProfile(): Promise<void> {
    const currentProfile = this.getCurrentProfile()
    await this.applyProfileSettings(currentProfile)
  }

  /**
   * Remove unsupported fields from profile payload
   */
  private static sanitizeProfile(profile: ClaudeCodeProfile): ClaudeCodeProfile {
    const sanitized: ClaudeCodeProfile = {
      name: profile.name,
      authType: profile.authType,
    }

    if (profile.apiKey)
      sanitized.apiKey = profile.apiKey
    if (profile.baseUrl)
      sanitized.baseUrl = profile.baseUrl

    return sanitized
  }

  /**
   * Backup configuration
   */
  static backupConfig(): string | null {
    try {
      if (!exists(this.CONFIG_FILE)) {
        return null
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
      const backupPath = join(ZCF_CONFIG_DIR, `config.backup.${timestamp}.toml`)

      copyFile(this.CONFIG_FILE, backupPath)
      return backupPath
    }
    catch (error) {
      console.error('Failed to backup Claude Code config:', error)
      return null
    }
  }

  /**
   * Add configuration
   */
  static async addProfile(profile: ClaudeCodeProfile): Promise<OperationResult> {
    try {
      // Validation and implementation details...
      // See full implementation in reference file
      return { success: true }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Update configuration
   */
  static async updateProfile(id: string, data: Partial<ClaudeCodeProfile>): Promise<OperationResult> {
    // Implementation details...
    return { success: true }
  }

  /**
   * Delete configuration
   */
  static async deleteProfile(id: string): Promise<OperationResult> {
    // Implementation details...
    return { success: true }
  }

  /**
   * Switch configuration
   */
  static async switchProfile(id: string): Promise<OperationResult> {
    // Implementation details...
    return { success: true }
  }

  /**
   * List all configurations
   */
  static listProfiles(): ClaudeCodeProfile[] {
    const config = this.readConfig()
    if (!config) {
      return []
    }
    return Object.values(config.profiles)
  }

  /**
   * Get current configuration
   */
  static getCurrentProfile(): ClaudeCodeProfile | null {
    const config = this.readConfig()
    if (!config || !config.currentProfileId) {
      return null
    }
    return config.profiles[config.currentProfileId] || null
  }

  /**
   * Generate profile ID from name
   */
  static generateProfileId(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'profile'
  }

  /**
   * Validate configuration
   */
  static validateProfile(profile: Partial<ClaudeCodeProfile>, isUpdate: boolean = false): string[] {
    const errors: string[] = []
    // Validation logic...
    return errors
  }
}
