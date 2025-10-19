import { internalMutation } from "./_generated/server";

export const clearAllRevenues = internalMutation({
  args: {},
  handler: async (ctx) => {
    const revenues = await ctx.db.query("revenues").collect();
    for (const revenue of revenues) {
      await ctx.db.delete(revenue._id);
    }
    return { deleted: revenues.length };
  },
});
