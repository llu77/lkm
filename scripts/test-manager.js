#!/usr/bin/env node

/**
 * Test Status Manager
 * Manages structured test state in tests.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TESTS_FILE = path.join(__dirname, '../tests.json');

class TestManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const content = fs.readFileSync(TESTS_FILE, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading tests.json:', error.message);
      process.exit(1);
    }
  }

  save() {
    this.updateSummary();
    this.data.meta.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TESTS_FILE, JSON.stringify(this.data, null, 2));
  }

  updateSummary() {
    const summary = {
      total: 0,
      passing: 0,
      failing: 0,
      not_started: 0,
      skipped: 0
    };

    this.data.suites.forEach(suite => {
      suite.tests.forEach(test => {
        summary.total++;
        summary[test.status]++;
      });
    });

    this.data.summary = summary;
  }

  updateTest(testId, status, error = null) {
    let found = false;

    for (const suite of this.data.suites) {
      const test = suite.tests.find(t => t.id === testId);
      if (test) {
        test.status = status;
        if (error) {
          test.error = error;
          test.lastRun = new Date().toISOString();
        } else {
          delete test.error;
          test.lastRun = new Date().toISOString();
        }
        found = true;
        break;
      }
    }

    if (!found) {
      console.error(`Test ${testId} not found`);
      return false;
    }

    this.save();
    return true;
  }

  getStatus() {
    this.updateSummary();
    return this.data.summary;
  }

  listTests(filter = {}) {
    const tests = [];

    this.data.suites.forEach(suite => {
      suite.tests.forEach(test => {
        const matches = Object.entries(filter).every(([key, value]) => {
          if (key === 'tags') {
            return test.tags?.includes(value);
          }
          return test[key] === value;
        });

        if (matches) {
          tests.push({
            ...test,
            suite: suite.name
          });
        }
      });
    });

    return tests;
  }

  printSummary() {
    const summary = this.getStatus();
    console.log('\n📊 Test Summary\n');
    console.log(`Total:       ${summary.total}`);
    console.log(`✅ Passing:   ${summary.passing}`);
    console.log(`❌ Failing:   ${summary.failing}`);
    console.log(`⏭️  Skipped:   ${summary.skipped}`);
    console.log(`⏸️  Not Started: ${summary.not_started}`);

    const percentage = summary.total > 0
      ? ((summary.passing / summary.total) * 100).toFixed(1)
      : 0;
    console.log(`\n📈 Pass Rate: ${percentage}%\n`);
  }

  printDetails() {
    console.log('\n🧪 Test Details\n');

    this.data.suites.forEach(suite => {
      const suitePassing = suite.tests.filter(t => t.status === 'passing').length;
      const suiteTotal = suite.tests.length;

      console.log(`\n${suite.name} (${suitePassing}/${suiteTotal})`);
      console.log('─'.repeat(50));

      suite.tests.forEach(test => {
        const icon = {
          passing: '✅',
          failing: '❌',
          not_started: '⏸️',
          skipped: '⏭️'
        }[test.status] || '❓';

        console.log(`${icon} [${test.id}] ${test.name}`);
        if (test.error) {
          console.log(`   Error: ${test.error}`);
        }
      });
    });
    console.log();
  }
}

// CLI Commands
const args = process.argv.slice(2);
const command = args[0];

const manager = new TestManager();

switch (command) {
  case 'status':
  case 'summary':
    manager.printSummary();
    break;

  case 'list':
    manager.printDetails();
    break;

  case 'update':
    const [, testId, status, ...errorParts] = args;
    const error = errorParts.join(' ') || null;
    if (manager.updateTest(testId, status, error)) {
      console.log(`✅ Updated ${testId} → ${status}`);
      manager.printSummary();
    }
    break;

  case 'passing':
  case 'failing':
  case 'not_started':
  case 'skipped':
    const filtered = manager.listTests({ status: command });
    console.log(`\n${command.toUpperCase()} Tests:\n`);
    filtered.forEach(test => {
      console.log(`[${test.id}] ${test.name} (${test.suite})`);
    });
    console.log(`\nTotal: ${filtered.length}\n`);
    break;

  case 'help':
  default:
    console.log(`
📝 Test Manager CLI

Usage: node scripts/test-manager.js <command> [args]

Commands:
  status, summary          Show test statistics
  list                     Show detailed test list
  update <id> <status>     Update test status
  passing                  List passing tests
  failing                  List failing tests
  not_started              List not started tests
  skipped                  List skipped tests
  help                     Show this help

Status values:
  passing, failing, not_started, skipped

Examples:
  node scripts/test-manager.js status
  node scripts/test-manager.js update auth_001 passing
  node scripts/test-manager.js update pay_001 failing "Calculation error"
  node scripts/test-manager.js list
    `);
    break;
}
