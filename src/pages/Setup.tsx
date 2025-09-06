import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Users, Home } from 'lucide-react';

export default function Setup() {
  const { user, createFamily } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    familyName: '',
    parentName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.familyName.trim() || !formData.parentName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome da família e seu nome.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await createFamily(
        formData.familyName.trim(),
        formData.parentName.trim(),
        formData.phone.trim() || undefined
      );

      if (error) {
        toast({
          title: "Erro ao criar família",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Família criada!",
        description: "Sua família foi configurada com sucesso.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao configurar sua família.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Home className="w-6 h-6 text-primary" />
            Configure sua Família
          </CardTitle>
          <p className="text-muted-foreground">
            Vamos configurar o sistema de tarefas e mesadas
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="familyName">Nome da Família *</Label>
              <Input
                id="familyName"
                type="text"
                placeholder="Ex: Família Silva"
                value={formData.familyName}
                onChange={(e) =>
                  setFormData({ ...formData, familyName: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentName">Seu Nome *</Label>
              <Input
                id="parentName"
                type="text"
                placeholder="Ex: Maria Silva"
                value={formData.parentName}
                onChange={(e) =>
                  setFormData({ ...formData, parentName: e.target.value })
                }
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Criando família...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Criar Família
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}