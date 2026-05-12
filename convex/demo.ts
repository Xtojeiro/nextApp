import { mutation } from "./_generated/server";

async function findUserByEmail(ctx: any, email: string) {
  return ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .first();
}

async function ensureDemoUser(
  ctx: any,
  user: {
    email: string;
    fullName: string;
    role: "PLAYER" | "COACH" | "SCOUT";
    bio?: string;
  },
) {
  const existing = await findUserByEmail(ctx, user.email);
  if (existing) return existing._id;

  const now = Date.now();
  return ctx.db.insert("users", {
    email: user.email,
    name: user.fullName,
    full_name: user.fullName,
    role: user.role,
    bio: user.bio,
    is_active: true,
    is_public: true,
    created_at: now,
    updated_at: now,
  });
}

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const coachId = await ensureDemoUser(ctx, {
      email: "coach.demo@nextapp.local",
      fullName: "Treinador Demo",
      role: "COACH",
      bio: "Conta demo para validar planeamento, equipa e jogos.",
    });
    const playerId = await ensureDemoUser(ctx, {
      email: "player.demo@nextapp.local",
      fullName: "Jogador Demo",
      role: "PLAYER",
      bio: "Atleta demo com estatisticas e treinos.",
    });
    const scoutId = await ensureDemoUser(ctx, {
      email: "scout.demo@nextapp.local",
      fullName: "Olheiro Demo",
      role: "SCOUT",
      bio: "Olheiro demo para pesquisa e relatorios.",
    });

    let team = await ctx.db
      .query("teams")
      .withIndex("by_coachId", (q) => q.eq("coachId", coachId))
      .first();
    if (!team) {
      const teamId = await ctx.db.insert("teams", {
        name: "Equipa Demo",
        description: "Equipa criada pelo seed Convex.",
        coachId,
        createdAt: now,
        updatedAt: now,
      });
      team = await ctx.db.get(teamId);
    }

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", coachId))
      .first();
    if (!coachProfile) {
      await ctx.db.insert("coaches", { userId: coachId, teamId: team!._id });
    }

    const playerProfile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", playerId))
      .first();
    if (!playerProfile) {
      await ctx.db.insert("players", {
        userId: playerId,
        teamId: team!._id,
        coachId,
        position: "Avancado",
        stats: {
          gamesPlayed: 12,
          wins: 8,
          losses: 4,
          points: 9,
          assists: 5,
          rebounds: 0,
        },
      });
    }

    const workoutId = await ctx.db.insert("workouts", {
      user_id: playerId,
      name: "Treino demo",
      description: "Sessao de finalizacao e resistencia.",
      type: "technical",
      duration_minutes: 60,
      objective: "Finalizacao",
      status: "scheduled",
      created_at: now,
    });

    await ctx.db.insert("events", {
      title: "Treino coletivo demo",
      date: new Date(now + day).toISOString().slice(0, 10),
      start_time: "19:00",
      end_time: "20:30",
      location: "Campo principal",
      type: "training",
      user_id: coachId,
      created_at: now,
    });

    const gameId = await ctx.db.insert("games", {
      name: "Jogo demo",
      team1Id: team!._id,
      team2Id: team!._id,
      date: now + 2 * day,
      location: "Estadio demo",
      status: "scheduled",
      createdBy: coachId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("gameStats", {
      gameId,
      playerId,
      teamId: team!._id,
      points: 2,
      assists: 1,
      rebounds: 0,
      createdAt: now,
    });

    await ctx.db.insert("scoutReports", {
      scoutId,
      athleteId: playerId,
      content: "Relatorio demo criado para validar o modulo de olheiro.",
      rating: 8,
      position: "Avancado",
      strengths: ["mobilidade", "finalizacao"],
      weaknesses: ["pe esquerdo"],
      createdAt: now,
    });

    return { success: true };
  },
});
