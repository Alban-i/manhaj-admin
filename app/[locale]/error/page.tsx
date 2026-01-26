import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="mx-auto max-w-sm min-w-80">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">
              Erreur d'authentification
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Une erreur s'est produite lors de la vérification de votre lien.
              Le lien peut avoir expiré ou être invalide.
            </p>
            <div className="space-y-2">
              <Link href="/login" className="block">
                <Button className="w-full">Retour à la connexion</Button>
              </Link>
              <p className="text-sm text-gray-500">
                Vous pouvez essayer de demander un nouveau lien de
                réinitialisation si nécessaire.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
