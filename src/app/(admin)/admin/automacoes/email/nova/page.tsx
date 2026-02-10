'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    ArrowLeft,
    Loader2,
    Save,
    Send,
    Mail,
    Eye,
    Code,
    Users,
    User,
    Building2,
    MapPin,
    FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
    id: string
    name: string
    isActive: boolean
}

interface City {
    id: string
    name: string
    state: string
    isActive: boolean
}

const TARGET_TYPES = [
    { value: 'INDIVIDUAL', label: 'Email Individual', icon: User, description: 'Enviar para um email específico' },
    { value: 'ALL_ASSINANTES', label: 'Todos os Assinantes', icon: Users, description: 'Enviar para todos os assinantes ativos' },
    { value: 'PLANO_ESPECIFICO', label: 'Plano Específico', icon: FileText, description: 'Enviar para assinantes de um plano' },
    { value: 'CIDADE_ESPECIFICA', label: 'Cidade Específica', icon: MapPin, description: 'Enviar para assinantes de uma cidade' },
    { value: 'ALL_PARCEIROS', label: 'Todos os Parceiros', icon: Building2, description: 'Enviar para todos os parceiros' },
    { value: 'TODOS', label: 'Todos (Assinantes + Parceiros)', icon: Users, description: 'Enviar para toda a base' },
]

// Template HTML básico
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UNICA Clube de Benefícios</h1>
    </div>
    <div class="content">
      <h2>Olá!</h2>
      <p>Escreva sua mensagem aqui...</p>
      <p>Atenciosamente,<br>Equipe UNICA</p>
    </div>
    <div class="footer">
      <p>© 2024 UNICA Clube de Benefícios. Todos os direitos reservados.</p>
      <p>Este email foi enviado para você porque você faz parte da nossa comunidade.</p>
    </div>
  </div>
</body>
</html>`

export default function NovaCampanhaEmailPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [plans, setPlans] = useState<Plan[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [activeTab, setActiveTab] = useState('editor')

    const [formData, setFormData] = useState({
        subject: '',
        htmlContent: DEFAULT_HTML_TEMPLATE,
        textContent: '',
        targetType: '',
        targetPlanId: '',
        targetCityId: '',
        individualEmail: '',
    })

    // Carregar planos e cidades
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, citiesRes] = await Promise.all([
                    fetch('/api/admin/plans'),
                    fetch('/api/admin/cities')
                ])

                if (plansRes.ok) {
                    const plansData = await plansRes.json()
                    setPlans(Array.isArray(plansData) ? plansData.filter((p: Plan) => p.isActive) : [])
                }

                if (citiesRes.ok) {
                    const citiesData = await citiesRes.json()
                    setCities(Array.isArray(citiesData) ? citiesData.filter((c: City) => c.isActive) : [])
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
            }
        }

        fetchData()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const validateForm = () => {
        if (!formData.subject.trim()) {
            toast.error('Assunto é obrigatório')
            return false
        }

        if (!formData.htmlContent.trim()) {
            toast.error('Conteúdo do email é obrigatório')
            return false
        }

        if (!formData.targetType) {
            toast.error('Selecione o tipo de destinatário')
            return false
        }

        if (formData.targetType === 'INDIVIDUAL' && !formData.individualEmail.trim()) {
            toast.error('Email do destinatário é obrigatório')
            return false
        }

        if (formData.targetType === 'PLANO_ESPECIFICO' && !formData.targetPlanId) {
            toast.error('Selecione um plano')
            return false
        }

        if (formData.targetType === 'CIDADE_ESPECIFICA' && !formData.targetCityId) {
            toast.error('Selecione uma cidade')
            return false
        }

        return true
    }

    const handleSave = async (sendNow = false) => {
        if (!validateForm()) return

        if (sendNow) {
            setSending(true)
        } else {
            setSaving(true)
        }

        try {
            // Criar campanha
            const createResponse = await fetch('/api/admin/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: formData.subject.trim(),
                    htmlContent: formData.htmlContent,
                    textContent: formData.textContent || null,
                    targetType: formData.targetType,
                    targetPlanId: formData.targetPlanId || null,
                    targetCityId: formData.targetCityId || null,
                    individualEmail: formData.individualEmail || null,
                })
            })

            if (!createResponse.ok) {
                const data = await createResponse.json()
                throw new Error(data.error || 'Erro ao criar campanha')
            }

            const campaign = await createResponse.json()

            if (sendNow) {
                // Enviar imediatamente
                const sendResponse = await fetch(`/api/admin/email/${campaign.id}/enviar`, {
                    method: 'POST'
                })

                const sendData = await sendResponse.json()

                if (!sendResponse.ok) {
                    throw new Error(sendData.error || 'Erro ao enviar campanha')
                }

                toast.success(sendData.message || 'Campanha enviada com sucesso!')
            } else {
                toast.success('Rascunho salvo com sucesso!')
            }

            router.push('/admin/automacoes/email')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
            setSending(false)
        }
    }

    const getTargetConfig = (value: string) =>
        TARGET_TYPES.find(t => t.value === value)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/automacoes/email">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Nova Campanha de Email</h1>
                        <p className="text-muted-foreground">Crie e envie emails para sua base</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Assunto */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Assunto do Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="Ex: Novidades exclusivas para você!"
                                className="text-lg"
                            />
                        </CardContent>
                    </Card>

                    {/* Conteúdo */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conteúdo do Email</CardTitle>
                            <CardDescription>
                                Edite o HTML do email ou use o preview para visualizar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="editor" className="gap-2">
                                        <Code className="h-4 w-4" />
                                        Editor HTML
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </TabsTrigger>
                                    <TabsTrigger value="text" className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Texto Alternativo
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="editor">
                                    <Textarea
                                        name="htmlContent"
                                        value={formData.htmlContent}
                                        onChange={handleChange}
                                        placeholder="Cole seu HTML aqui..."
                                        className="font-mono text-sm min-h-[400px]"
                                    />
                                </TabsContent>

                                <TabsContent value="preview">
                                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                                        <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                            </div>
                                            <span className="text-sm text-muted-foreground ml-2">Preview do Email</span>
                                        </div>
                                        <iframe
                                            srcDoc={formData.htmlContent.replace('{{subject}}', formData.subject || 'Assunto do Email')}
                                            className="w-full h-[400px] bg-white"
                                            title="Preview do Email"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="text">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            Versão em texto puro para clientes de email que não suportam HTML (opcional)
                                        </p>
                                        <Textarea
                                            name="textContent"
                                            value={formData.textContent}
                                            onChange={handleChange}
                                            placeholder="Versão em texto puro do email..."
                                            className="min-h-[300px]"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-6">
                    {/* Destinatários */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Destinatários</CardTitle>
                            <CardDescription>Quem receberá este email?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo de Envio</Label>
                                <Select
                                    value={formData.targetType}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        targetType: value,
                                        targetPlanId: '',
                                        targetCityId: '',
                                        individualEmail: ''
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TARGET_TYPES.map((target) => {
                                            const Icon = target.icon
                                            return (
                                                <SelectItem key={target.value} value={target.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {target.label}
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                {formData.targetType && (
                                    <p className="text-xs text-muted-foreground">
                                        {getTargetConfig(formData.targetType)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Campo dinâmico baseado no tipo */}
                            {formData.targetType === 'INDIVIDUAL' && (
                                <div className="space-y-2">
                                    <Label htmlFor="individualEmail">Email do Destinatário</Label>
                                    <Input
                                        id="individualEmail"
                                        name="individualEmail"
                                        type="email"
                                        value={formData.individualEmail}
                                        onChange={handleChange}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            )}

                            {formData.targetType === 'PLANO_ESPECIFICO' && (
                                <div className="space-y-2">
                                    <Label>Selecione o Plano</Label>
                                    <Select
                                        value={formData.targetPlanId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, targetPlanId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um plano..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {formData.targetType === 'CIDADE_ESPECIFICA' && (
                                <div className="space-y-2">
                                    <Label>Selecione a Cidade</Label>
                                    <Select
                                        value={formData.targetCityId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, targetCityId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma cidade..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.map((city) => (
                                                <SelectItem key={city.id} value={city.id}>
                                                    {city.name} - {city.state}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resumo */}
                    {formData.targetType && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Resumo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Assunto:</span>
                                    <span className="font-medium truncate max-w-[150px]">
                                        {formData.subject || '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Destinatário:</span>
                                    <Badge variant="secondary">
                                        {getTargetConfig(formData.targetType)?.label}
                                    </Badge>
                                </div>
                                {formData.targetType === 'INDIVIDUAL' && formData.individualEmail && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium truncate max-w-[150px]">
                                            {formData.individualEmail}
                                        </span>
                                    </div>
                                )}
                                {formData.targetType === 'PLANO_ESPECIFICO' && formData.targetPlanId && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Plano:</span>
                                        <span className="font-medium">
                                            {plans.find(p => p.id === formData.targetPlanId)?.name}
                                        </span>
                                    </div>
                                )}
                                {formData.targetType === 'CIDADE_ESPECIFICA' && formData.targetCityId && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Cidade:</span>
                                        <span className="font-medium">
                                            {cities.find(c => c.id === formData.targetCityId)?.name}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Ações */}
                    <div className="space-y-3">
                        <Button
                            className="w-full"
                            onClick={() => handleSave(true)}
                            disabled={saving || sending}
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Enviar Agora
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleSave(false)}
                            disabled={saving || sending}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Rascunho
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
