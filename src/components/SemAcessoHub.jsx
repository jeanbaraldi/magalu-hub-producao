// Tela mostrada no lugar do app quando o Hub não libera a entrada (ou não responde).
export function SemAcessoHub({ estado, onTentarDeNovo, onSair }) {
  if (estado === 'verificando') {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-label="Conferindo acesso">
        <span className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
      </div>
    )
  }
  const negado = estado === 'negado'
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-xl font-semibold">
          {negado ? 'Você não tem acesso ao Gestor Magalu' : 'Não consegui conferir seu acesso'}
        </h1>
        <p className="text-sm opacity-70">
          {negado
            ? 'Fale com o administrador no Hub para liberar esta ferramenta.'
            : 'O Hub não respondeu. Confira sua conexão e tente de novo.'}
        </p>
        <div className="flex gap-2 justify-center">
          {!negado && <button type="button" className="px-4 py-2 rounded-md border" onClick={onTentarDeNovo}>Tentar de novo</button>}
          <button type="button" className="px-4 py-2 rounded-md border" onClick={onSair}>Sair</button>
        </div>
      </div>
    </div>
  )
}
