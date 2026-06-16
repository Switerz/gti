export const toToolResult = <T extends Record<string, unknown>>(structuredContent: T) => ({
  structuredContent,
  content: [
    {
      type: 'text' as const,
      text: JSON.stringify(structuredContent, null, 2),
    },
  ],
})
