"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserButton } from "@clerk/nextjs";

export default function LobbyPage() {
  const router = useRouter();
  const { user } = useUser();
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Game settings state
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [rounds, setRounds] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionsPerRound, setQuestionsPerRound] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["History", "Science", "Geography"]);
  const [isPublic, setIsPublic] = useState(true);

  const publicRooms = useQuery(api.gameRooms.getPublicRooms);
  const createRoomMutation = useMutation(api.gameRooms.createRoom);
  const joinRoomMutation = useMutation(api.gameRooms.joinRoom);
  const createUserMutation = useMutation(api.users.createUser);
  const currentUser = useQuery(api.users.getUserByClerkId, { 
    clerkId: user?.id || "" 
  });

  const categories = [
    "History", "Science", "Geography", "Sports", 
    "Pop Culture", "Literature", "Movies", "Music",
    "Technology", "Nature", "Food & Drink", "Art"
  ];

  const handleCreateRoom = async () => {
    if (!user || !currentUser) return;
    
    setIsCreating(true);
    try {
      // Ensure user exists in database
      let userId = currentUser._id;
      if (!userId) {
        userId = await createUserMutation({
          clerkId: user.id,
          username: user.username || user.firstName || "Player",
          avatarUrl: user.imageUrl,
        });
      }

      const { roomId, code } = await createRoomMutation({
        hostId: userId,
        settings: {
          maxPlayers,
          rounds,
          categories: selectedCategories,
          difficulty,
          timeLimit,
          questionsPerRound,
        },
        isPublic,
      });

      toast.success(`Room created! Code: ${code}`);
      router.push(`/game/${roomId}`);
    } catch (error) {
      toast.error("Failed to create room");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomCode?: string) => {
    const code = roomCode || joinCode;
    if (!code || !user || !currentUser) return;

    try {
      // Ensure user exists in database
      let userId = currentUser._id;
      if (!userId) {
        userId = await createUserMutation({
          clerkId: user.id,
          username: user.username || user.firstName || "Player",
          avatarUrl: user.imageUrl,
        });
      }

      const roomId = await joinRoomMutation({
        code: code.toUpperCase(),
        userId,
      });

      toast.success("Joined room successfully!");
      router.push(`/game/${roomId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join room");
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Game Lobby</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || "Player"}!
              </span>
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="join" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="join">Join Game</TabsTrigger>
            <TabsTrigger value="create">Create Game</TabsTrigger>
            <TabsTrigger value="public">Public Games</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Join a Game</CardTitle>
                <CardDescription>
                  Enter a room code to join an existing game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Room Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={() => handleJoinRoom()}
                  disabled={joinCode.length !== 6}
                  className="w-full"
                >
                  Join Room
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Game</CardTitle>
                <CardDescription>
                  Configure your game settings and invite friends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="players">Max Players</Label>
                    <select
                      id="players"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rounds">Number of Rounds</Label>
                    <select
                      id="rounds"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value))}
                    >
                      {[3, 5, 7, 10].map(n => (
                        <option key={n} value={n}>{n} Rounds</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time per Question</Label>
                    <select
                      id="time"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                    >
                      <option value={10}>10 seconds</option>
                      <option value={20}>20 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={45}>45 seconds</option>
                      <option value={60}>60 seconds</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categories (select at least 1)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategories.includes(category) ? "default" : "outline"}
                        className="cursor-pointer p-2 justify-center"
                        onClick={() => toggleCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="public">Make room public</Label>
                </div>

                <Button 
                  onClick={handleCreateRoom}
                  disabled={isCreating || selectedCategories.length === 0}
                  className="w-full"
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Public Games</CardTitle>
                <CardDescription>
                  Join an open game room
                </CardDescription>
              </CardHeader>
              <CardContent>
                {publicRooms && publicRooms.length > 0 ? (
                  <div className="space-y-2">
                    {publicRooms.map((room: any) => (
                      <div
                        key={room._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold">Room {room.code}</p>
                          <p className="text-sm text-gray-600">
                            {room.participantCount}/{room.settings.maxPlayers} players
                          </p>
                          <div className="flex gap-1 mt-1">
                            {room.settings.categories.slice(0, 3).map((cat: string) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {room.settings.categories.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{room.settings.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinRoom(room.code)}
                          disabled={room.participantCount >= room.settings.maxPlayers}
                        >
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No public games available. Create one!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}