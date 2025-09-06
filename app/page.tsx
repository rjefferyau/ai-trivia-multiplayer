import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-indigo-600">AI Trivia</span>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <SignedIn>
                <Link href="/lobby">
                  <Button variant="ghost">Lobby</Button>
                </Link>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Multiplayer Trivia
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Challenge friends in real-time trivia battles with AI-generated questions
            that are fact-checked for accuracy. Play with up to 4 players!
          </p>
          <div className="mt-8 space-x-4">
            <SignedIn>
              <Link href="/lobby">
                <Button size="lg">Go to Lobby</Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg">Play Now</Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </SignedOut>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dynamic questions created by AI for endless variety. Every game is unique
                with questions tailored to your selected categories and difficulty.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fact-Checked Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All questions are verified by secondary AI systems to ensure accuracy.
                Learn while you play with confidence in the content.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-Time Multiplayer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Compete with up to 4 players simultaneously. See live scores, chat with
                opponents, and experience seamless real-time gameplay.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <div className="p-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Create or Join</h3>
              <p className="text-sm text-gray-600">Start a new game or join with a code</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Configure Game</h3>
              <p className="text-sm text-gray-600">Choose categories, rounds, and difficulty</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Play Together</h3>
              <p className="text-sm text-gray-600">Answer questions in real-time</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Win & Learn</h3>
              <p className="text-sm text-gray-600">See results and track your progress</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}