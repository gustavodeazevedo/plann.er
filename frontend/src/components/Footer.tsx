import { Github, Heart, Calendar } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo e descrição */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-6 text-lime-300" />
              <span className="text-xl font-semibold text-zinc-100">Plann.er</span>
            </div>
            <p className="text-sm text-zinc-400 text-center md:text-left">
              Planeje suas viagens com facilidade
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3">
            <a
              href="https://github.com/gustavodeazevedo/plann.er"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-lime-300 transition-colors"
            >
              <Github className="size-4" />
              <span>Contribua no GitHub</span>
            </a>
            
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>Feito com</span>
              <Heart className="size-4 text-red-500 fill-red-500" />
              <span>por estudantes</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-zinc-500">
              © {currentYear} Plann.er
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
