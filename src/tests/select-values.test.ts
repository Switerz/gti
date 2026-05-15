import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const filesWithSelects = [
  'src/components/kanban/TeamBoardFilters.tsx',
  'src/components/kanban/KanbanFilters.tsx',
  'src/components/tasks/TaskFormDrawer.tsx',
  'src/components/tasks/detail/TaskSidebar.tsx',
  'src/pages/ProjectsPage.tsx',
  'src/pages/TaskListPage.tsx',
]

describe('Radix Select values', () => {
  it('does not render SelectItem with an empty string value', () => {
    for (const file of filesWithSelects) {
      const content = readFileSync(join(process.cwd(), file), 'utf8')
      expect(content, file).not.toContain('SelectItem value=""')
    }
  })
})
