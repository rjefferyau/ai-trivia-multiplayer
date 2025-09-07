"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const roomId = params.id as Id<"gameRooms">;
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showResults, setShowResults] = useState(false);

  const room = useQuery(api.gameRooms.getRoomById, { roomId });
  const currentQuestion = useQuery(api.questions.getCurrentQuestion, { roomId });
  const currentUser = useQuery(api.users.getUserByClerkId, { 
    clerkId: user?.id || "" 
  });
  
  const setReadyMutation = useMutation(api.gameRooms.setPlayerReady);
  const submitAnswerMutation = useMutation(api.questions.submitAnswer);
  const leaveRoomMutation = useMutation(api.gameRooms.leaveRoom);
  const revealQuestionMutation = useMutation(api.questions.revealQuestion);

  // Timer effect
  useEffect(() => {
    if (room?.status === "in_progress" && currentQuestion && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, room?.status, currentQuestion]);

  // Reset timer when new question appears
  useEffect(() => {
    if (currentQuestion) {
      setTimeLeft(room?.settings.timeLimit || 30);
      setSelectedAnswer(null);
      setShowResults(false);
    }
  }, [currentQuestion?._id]);

  const handleReady = async () => {
    if (!currentUser || !room) return;
    
    const participant = room.participants.find((p: any) => p.userId === currentUser._id);
    if (!participant) return;

    try {
      await setReadyMutation({
        roomId,
        userId: currentUser._id,
        isReady: !participant.isReady,
      });
    } catch (error) {
      toast.error("Failed to update ready status");
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentUser || !currentQuestion || selectedAnswer) return;
    
    setSelectedAnswer(answer);
    
    try {
      const result = await submitAnswerMutation({
        roomId,
        userId: currentUser._id,
        questionId: currentQuestion._id as Id<"questions">,
        answer,
      });
      
      if (result.isCorrect) {
        toast.success(`Correct! +${result.pointsEarned} points`);
      } else {
        toast.error("Wrong answer!");
      }
    } catch (error) {
      toast.error("Failed to submit answer");
    }
  };

  const handleTimeUp = () => {
    if (!selectedAnswer) {
      toast.warning("Time's up!");
    }
    setShowResults(true);
  };

  const handleLeaveRoom = async () => {
    if (!currentUser) return;
    
    try {
      await leaveRoomMutation({
        roomId,
        userId: currentUser._id,
      });
      router.push("/lobby");
    } catch (error) {
      toast.error("Failed to leave room");
    }
  };

  const handleNextQuestion = async () => {
    if (!room || room.hostId !== currentUser?._id) return;
    
    const nextIndex = (room.currentQuestionIndex || 0) + 1;
    
    try {
      await revealQuestionMutation({
        roomId,
        questionIndex: nextIndex,
      });
    } catch (error) {
      toast.error("Failed to reveal next question");
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading game...</p>
      </div>
    );
  }

  const isHost = room.hostId === currentUser?._id;
  const myParticipant = room.participants.find((p: any) => p.userId === currentUser?._id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Room: {room.code}</h1>
            <Badge variant={room.status === "waiting" ? "secondary" : "default"}>
              {room.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-lg">
              Round {room.currentRound}/{room.settings.rounds}
            </span>
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Game
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Players Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {room.participants.map((participant: any) => (
                  <div
                    key={participant._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.user?.avatarUrl} />
                        <AvatarFallback>
                          {participant.user?.username?.[0] || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {participant.user?.username}
                          {participant.userId === room.hostId && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Host
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          Score: {participant.score}
                        </p>
                      </div>
                    </div>
                    {room.status === "waiting" && (
                      <Badge variant={participant.isReady ? "default" : "outline"}>
                        {participant.isReady ? "Ready" : "Not Ready"}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {room.status === "waiting" && (
              <Card>
                <CardHeader>
                  <CardTitle>Game Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rounds:</span>
                    <span className="font-medium">{room.settings.rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions/Round:</span>
                    <span className="font-medium">{room.settings.questionsPerRound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <span className="font-medium">{room.settings.timeLimit}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="font-medium capitalize">{room.settings.difficulty}</span>
                  </div>
                  <div className="mt-2">
                    <span>Categories:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.settings.categories.map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {room.status === "waiting" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Waiting for Players</CardTitle>
                  <CardDescription>
                    {room.participants.length}/{room.settings.maxPlayers} players joined
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-lg mb-4">
                      Share this code with your friends:
                    </p>
                    <p className="text-4xl font-bold text-indigo-600 mb-6">
                      {room.code}
                    </p>
                    {myParticipant && (
                      <Button
                        onClick={handleReady}
                        variant={myParticipant.isReady ? "outline" : "default"}
                      >
                        {myParticipant.isReady ? "Not Ready" : "Ready to Start"}
                      </Button>
                    )}
                    {isHost && room.participants.every((p: any) => p.isReady) && room.participants.length >= 2 && (
                      <p className="text-green-600 mt-4">
                        All players ready! Game will start automatically.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : room.status === "in_progress" && currentQuestion ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className="mb-2">{currentQuestion.category}</Badge>
                      <CardTitle>Question {room.currentQuestionIndex || 1}</CardTitle>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {timeLeft}s
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg">{currentQuestion.content}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.options?.map((option: any) => (
                      <Button
                        key={option.id}
                        onClick={() => handleSubmitAnswer(option.id)}
                        disabled={selectedAnswer !== null || timeLeft === 0}
                        variant={
                          selectedAnswer === option.id
                            ? "default"
                            : "outline"
                        }
                        className="p-4 h-auto text-left justify-start"
                      >
                        <span className="font-bold mr-2">{option.id.toUpperCase()}.</span>
                        {option.text}
                      </Button>
                    ))}
                  </div>

                  {selectedAnswer && (
                    <p className="text-center text-gray-600">
                      Answer submitted! Waiting for other players...
                    </p>
                  )}

                  {showResults && isHost && (
                    <div className="text-center">
                      <Button onClick={handleNextQuestion}>
                        Next Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : room.status === "finished" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Game Over!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Final Scores:</h3>
                    {room.participants
                      .sort((a: any, b: any) => b.score - a.score)
                      .map((participant: any, index: number) => (
                        <div
                          key={participant._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""}
                            </span>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.user?.avatarUrl} />
                              <AvatarFallback>
                                {participant.user?.username?.[0] || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {participant.user?.username}
                            </span>
                          </div>
                          <span className="text-xl font-bold">
                            {participant.score} pts
                          </span>
                        </div>
                      ))}
                    <div className="text-center mt-6">
                      <Button onClick={() => router.push("/lobby")}>
                        Back to Lobby
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">Preparing next question...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}