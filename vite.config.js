import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Dois runtimes de teste convivem neste repo:
    //   Vitest → frontend (src/)
    //   Deno   → supabase/functions/
    // O Vitest descobre .test.ts por padrão e tentaria rodar os testes Deno,
    // que usam imports jsr:/https: e falham na coleta. Excluímos SÓ eles —
    // preservando o exclude padrão (node_modules, dist, etc.), senão o Vitest
    // passaria a varrer node_modules.
    // `.worktrees/` guarda git worktrees (gitignored). Sem excluí-lo, o Vitest
    // coleta os testes das OUTRAS branches ali dentro — rodando suíte duplicada
    // e falhando nos testes Deno delas, que este exclude não alcança por caminho.
    // `docs/` guarda estudos e protótipos, alguns com testes escritos em
    // `node:assert` para rodar direto pelo Node. Eles não têm suíte Vitest, e o
    // coletor os reprova por isso — derrubando o hook de pre-push por causa de
    // um arquivo que não é da aplicação. Mesma razão dos dois acima.
    exclude: [
      ...configDefaults.exclude,
      'supabase/functions/**/*.test.ts',
      '.worktrees/**',
      'docs/**',
    ],
  },
})
