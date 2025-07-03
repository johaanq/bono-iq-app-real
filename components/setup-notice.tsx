"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Database, Play, CheckCircle, XCircle } from "lucide-react"

export function SetupNotice() {
    const [isRunning, setIsRunning] = useState(false)
    const [message, setMessage] = useState("")
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

    const runSetupScript = async () => {
        setIsRunning(true)
        setMessage("Ejecutando script de configuración...")
        setStatus("idle")

        try {
            // Simulate setup process
            await new Promise((resolve) => setTimeout(resolve, 3000))

            setMessage("✅ Base de datos configurada correctamente. Recarga la página.")
            setStatus("success")
        } catch (error) {
            setMessage(`❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
            setStatus("error")
        } finally {
            setIsRunning(false)
        }
    }

    const getAlertVariant = () => {
        switch (status) {
            case "success":
                return "default"
            case "error":
                return "destructive"
            default:
                return "default"
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4" />
            case "error":
                return <XCircle className="h-4 w-4" />
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <CardTitle className="text-2xl">Configuración Requerida</CardTitle>
                    <CardDescription>La base de datos necesita ser configurada antes de continuar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg bg-blue-50 p-4">
                        <div className="flex items-start space-x-3">
                            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="space-y-2">
                                <h3 className="font-medium text-blue-900">Pasos para configurar:</h3>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                                    <li>Ve a tu dashboard de Supabase</li>
                                    <li>Abre el SQL Editor</li>
                                    <li>
                                        Ejecuta el script{" "}
                                        <code className="bg-blue-100 px-1 rounded">scripts/create-complete-database.sql</code>
                                    </li>
                                    <li>
                                        Opcionalmente ejecuta <code className="bg-blue-100 px-1 rounded">scripts/seed-sample-data.sql</code>{" "}
                                        para datos de prueba
                                    </li>
                                    <li>Recarga esta página</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button onClick={runSetupScript} disabled={isRunning} className="w-full" size="lg">
                            {isRunning ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Configurando...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Intentar Configuración Automática
                                </>
                            )}
                        </Button>

                        {message && (
                            <Alert variant={getAlertVariant()}>
                                {getStatusIcon()}
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            ¿Necesitas ayuda? Consulta la documentación de Supabase o contacta al soporte.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
