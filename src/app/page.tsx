import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  Settings, 
  ArrowRight,
  Upload
} from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vervoer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de procesamiento de documentos con OCR y gestión administrativa
          </p>
        </div>

        {/* Características principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Procesamiento OCR</CardTitle>
              <CardDescription>
                Extrae texto de imágenes y PDFs escaneados usando tecnología OCR avanzada
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra usuarios, roles y permisos del sistema de manera eficiente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Personaliza el sistema según tus necesidades específicas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Principal */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">¿Listo para empezar?</CardTitle>
              <CardDescription>
                Accede al panel administrativo para comenzar a procesar documentos y gestionar el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="mt-16 text-center text-gray-600">
          <p className="text-sm">
            Desarrollado con Next.js, TypeScript y Tailwind CSS
          </p>
        </div>
      </div>
    </main>
  )
}
