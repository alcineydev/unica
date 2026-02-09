'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Lock, Globe, Phone, Mail, MapPin, Save, Loader2, Eye, EyeOff, Search, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dados do perfil
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  // Redes sociais
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [youtube, setYoutube] = useState('')

  // Endereço
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // Senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Email change
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  // CEP
  const [searchingCep, setSearchingCep] = useState(false)

  // Carregar dados
  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/perfil')
      if (response.ok) {
        const data = await response.json()
        setEmail(data.email || '')
        setPhone(data.phone || data.admin?.phone || '')
        setName(data.admin?.name || '')
        setFacebook(data.admin?.facebook || '')
        setInstagram(data.admin?.instagram || '')
        setTiktok(data.admin?.tiktok || '')
        setYoutube(data.admin?.youtube || '')
        setCep(data.admin?.cep || '')
        setLogradouro(data.admin?.logradouro || '')
        setNumero(data.admin?.numero || '')
        setComplemento(data.admin?.complemento || '')
        setBairro(data.admin?.bairro || '')
        setCidade(data.admin?.cidade || '')
        setEstado(data.admin?.estado || '')
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Verificar parâmetros de URL
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast.success(success)
      window.history.replaceState({}, '', '/admin/configuracoes')
      loadProfile()
    }
    if (error) {
      toast.error(error)
      window.history.replaceState({}, '', '/admin/configuracoes')
    }
  }, [searchParams, loadProfile])

  // Formatadores
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  // Buscar CEP
  const handleSearchCep = async () => {
    const cepClean = cep.replace(/\D/g, '')
    if (cepClean.length !== 8) {
      toast.error('CEP deve ter 8 dígitos')
      return
    }

    setSearchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      setLogradouro(data.logradouro || '')
      setBairro(data.bairro || '')
      setCidade(data.localidade || '')
      setEstado(data.uf || '')
      toast.success('Endereço encontrado!')
    } catch (error) {
      toast.error('Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  // Salvar
  const handleSave = async () => {
    // Validar senha
    if (newPassword) {
      if (!currentPassword) {
        toast.error('Informe a senha atual')
        return
      }
      if (newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres')
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error('As senhas não coincidem')
        return
      }
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          facebook,
          instagram,
          tiktok,
          youtube,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao salvar')
        return
      }

      toast.success(data.message || 'Salvo com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Alterar email
  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Informe um e-mail válido')
      return
    }

    setChangingEmail(true)
    try {
      const response = await fetch('/api/admin/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao solicitar')
        return
      }

      toast.success(data.message)
      setEmailDialogOpen(false)
      setNewEmail('')
    } catch (error) {
      toast.error('Erro ao processar')
    } finally {
      setChangingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Configurações"
          description="Gerencie suas informações pessoais e de contato"
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {/* SEÇÃO 1: Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Deixe em branco se não quiser alterar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Mínimo 6 caracteres</p>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Redes Sociais
          </CardTitle>
          <CardDescription>
            Links das redes sociais do clube
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/seuclube"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/seuclube"
              />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@seuclube"
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@seuclube"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail
            </Label>
            <div className="flex gap-3">
              <Input value={email} disabled className="bg-gray-50 flex-1" />
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Alterar E-mail</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar E-mail</DialogTitle>
                    <DialogDescription>
                      Um link de confirmação será enviado para o novo e-mail.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>E-mail Atual</Label>
                      <Input value={email} disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Novo E-mail</Label>
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="novo@email.com"
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        O link será enviado para o <strong>novo e-mail</strong>.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleChangeEmail} disabled={changingEmail}>
                      {changingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enviar Confirmação
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label>Telefone / WhatsApp</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>

          {/* Endereço */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 text-base font-semibold mb-4">
              <MapPin className="w-4 h-4" />
              Endereço
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <Input
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleSearchCep} disabled={searchingCep}>
                    {searchingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro</Label>
                <Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Rua, Avenida..." />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Sala 01" />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sinop" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
