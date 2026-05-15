import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, mutation } from "./_generated/server";

const LEAGUE_PASSWORD_PREFIX = "PAP2026!";

type SeedRole = "PLAYER" | "COACH" | "SCOUT";

type SeedAccount = {
  email: string;
  password: string;
  fullName: string;
  role: SeedRole;
  teamIndex: number;
  position?: string;
};

const positions = [
  "Guarda-redes",
  "Defesa direito",
  "Defesa central",
  "Defesa central",
  "Defesa esquerdo",
  "Medio defensivo",
  "Medio centro",
  "Medio ofensivo",
  "Extremo direito",
  "Avancado",
  "Extremo esquerdo",
];

const teamSeeds = [
  {
    name: "Equipa Norte",
    description: "Plantel demo da zona norte.",
    location: "Campo Norte",
  },
  {
    name: "Equipa Centro",
    description: "Plantel demo da zona centro.",
    location: "Campo Centro",
  },
  {
    name: "Equipa Sul",
    description: "Plantel demo da zona sul.",
    location: "Campo Sul",
  },
];

const seedAccounts: SeedAccount[] = teamSeeds.flatMap((team, teamIndex) => {
  const suffix = String(teamIndex + 1).padStart(2, "0");
  return [
    {
      email: `treinador${suffix}@pap.local`,
      password: `${LEAGUE_PASSWORD_PREFIX}treinador${suffix}`,
      fullName: `Treinador ${team.name}`,
      role: "COACH",
      teamIndex,
    },
    {
      email: `olheiro${suffix}@pap.local`,
      password: `${LEAGUE_PASSWORD_PREFIX}olheiro${suffix}`,
      fullName: `Olheiro ${team.name}`,
      role: "SCOUT",
      teamIndex,
    },
    ...positions.map((position, playerIndex) => {
      const playerNumber = String(teamIndex * 11 + playerIndex + 1).padStart(2, "0");
      return {
        email: `jogador${playerNumber}@pap.local`,
        password: `${LEAGUE_PASSWORD_PREFIX}jogador${playerNumber}`,
        fullName: `Jogador ${playerNumber} ${team.name}`,
        role: "PLAYER" as const,
        teamIndex,
        position,
      };
    }),
  ];
});

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ensureNamedDocument(
  ctx: any,
  table: "games" | "workouts" | "trainingPlans",
  name: string,
) {
  const docs = await ctx.db.query(table).collect();
  return docs.find((doc: any) => doc.name === name);
}

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

export const seedLeagueDemoAccounts = action({
  args: {},
  handler: async (ctx) => {
    const createdAccounts = [];

    for (const account of seedAccounts) {
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: {
          id: account.email,
          secret: account.password,
        },
        profile: {
          email: account.email,
          name: account.fullName,
          full_name: account.fullName,
          role: account.role,
          bio:
            account.role === "PLAYER"
              ? `Atleta demo da ${teamSeeds[account.teamIndex].name}.`
              : `${account.fullName} da ${teamSeeds[account.teamIndex].name}.`,
          location: teamSeeds[account.teamIndex].location,
          is_active: true,
          is_public: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        shouldLinkViaEmail: false,
        shouldLinkViaPhone: false,
      });

      createdAccounts.push({
        ...account,
        userId: user._id,
      });
    }

    const result = await ctx.runMutation("demo:seedLeagueDemoData" as any, {
      accounts: createdAccounts,
    });

    return {
      ...result,
      credentials: seedAccounts.map(({ email, password, fullName, role, teamIndex }) => ({
        email,
        password,
        fullName,
        role,
        team: teamSeeds[teamIndex].name,
      })),
    };
  },
});

export const seedLeagueDemoData = internalMutation({
  args: {
    accounts: v.array(
      v.object({
        email: v.string(),
        password: v.string(),
        fullName: v.string(),
        role: v.union(v.literal("PLAYER"), v.literal("COACH"), v.literal("SCOUT")),
        teamIndex: v.number(),
        position: v.optional(v.string()),
        userId: v.id("users"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const teams = [];

    for (let teamIndex = 0; teamIndex < teamSeeds.length; teamIndex++) {
      const seed = teamSeeds[teamIndex];
      const coach = args.accounts.find(
        (account) => account.teamIndex === teamIndex && account.role === "COACH",
      )!;

      await ctx.db.patch(coach.userId, {
        password_hash: await hashPassword(coach.password),
        role: "COACH",
        full_name: coach.fullName,
        name: coach.fullName,
        is_active: true,
        is_public: true,
        updated_at: now,
      });

      const existingTeams = await ctx.db.query("teams").collect();
      let team = existingTeams.find((candidate) => candidate.name === seed.name);
      if (!team) {
        const teamId = await ctx.db.insert("teams", {
          name: seed.name,
          description: seed.description,
          coachId: coach.userId,
          createdAt: now,
          updatedAt: now,
        });
        team = (await ctx.db.get(teamId))!;
      } else {
        await ctx.db.patch(team._id, {
          description: seed.description,
          coachId: coach.userId,
          updatedAt: now,
        });
        team = (await ctx.db.get(team._id))!;
      }
      teams.push(team);

      const coachProfile = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", coach.userId))
        .first();
      if (coachProfile) {
        await ctx.db.patch(coachProfile._id, {
          certification: "UEFA C Demo",
          experience: 5 + teamIndex,
          specialization: ["formacao", "tatico"],
          teamId: team._id,
        });
      } else {
        await ctx.db.insert("coaches", {
          userId: coach.userId,
          certification: "UEFA C Demo",
          experience: 5 + teamIndex,
          specialization: ["formacao", "tatico"],
          teamId: team._id,
        });
      }

      const scout = args.accounts.find(
        (account) => account.teamIndex === teamIndex && account.role === "SCOUT",
      )!;
      await ctx.db.patch(scout.userId, {
        password_hash: await hashPassword(scout.password),
        role: "SCOUT",
        full_name: scout.fullName,
        name: scout.fullName,
        is_active: true,
        is_public: true,
        updated_at: now,
      });

      const players = args.accounts.filter(
        (account) => account.teamIndex === teamIndex && account.role === "PLAYER",
      );
      for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
        const player = players[playerIndex];
        await ctx.db.patch(player.userId, {
          password_hash: await hashPassword(player.password),
          role: "PLAYER",
          full_name: player.fullName,
          name: player.fullName,
          is_active: true,
          is_public: true,
          updated_at: now,
        });

        const playerProfile = await ctx.db
          .query("players")
          .withIndex("by_userId", (q) => q.eq("userId", player.userId))
          .first();
        const stats = {
          gamesPlayed: 6,
          wins: teamIndex === 0 ? 4 : teamIndex === 1 ? 3 : 2,
          losses: teamIndex === 0 ? 1 : teamIndex === 1 ? 2 : 3,
          points: 2 + ((playerIndex + teamIndex) % 9),
          assists: (playerIndex + 2) % 5,
          rebounds: 0,
        };
        if (playerProfile) {
          await ctx.db.patch(playerProfile._id, {
            teamId: team._id,
            coachId: coach.userId,
            position: player.position,
            height: 165 + ((playerIndex * 3) % 25),
            weight: 58 + ((playerIndex * 4) % 22),
            dominantHand: playerIndex % 2 === 0 ? "right" : "left",
            stats,
          });
        } else {
          await ctx.db.insert("players", {
            userId: player.userId,
            teamId: team._id,
            coachId: coach.userId,
            position: player.position,
            height: 165 + ((playerIndex * 3) % 25),
            weight: 58 + ((playerIndex * 4) % 22),
            dominantHand: playerIndex % 2 === 0 ? "right" : "left",
            stats,
          });
        }

        const reportExists = (await ctx.db.query("scoutReports").collect()).some(
          (report) => report.scoutId === scout.userId && report.athleteId === player.userId,
        );
        if (!reportExists && playerIndex < 4) {
          await ctx.db.insert("scoutReports", {
            scoutId: scout.userId,
            athleteId: player.userId,
            content: `Relatorio demo do ${player.fullName}.`,
            rating: 7 + ((playerIndex + teamIndex) % 3),
            position: player.position,
            strengths: ["intensidade", "posicionamento"],
            weaknesses: ["consistencia"],
            createdAt: now,
          });
        }
      }

      const trainingWorkoutNames = [
        `Treino tecnico - ${seed.name}`,
        `Treino fisico - ${seed.name}`,
      ];
      const workoutIds = [];
      for (let workoutIndex = 0; workoutIndex < trainingWorkoutNames.length; workoutIndex++) {
        const workoutName = trainingWorkoutNames[workoutIndex];
        const existingWorkout = await ensureNamedDocument(ctx, "workouts", workoutName);
        if (existingWorkout) {
          workoutIds.push(existingWorkout._id);
        } else {
          workoutIds.push(
            await ctx.db.insert("workouts", {
              user_id: coach.userId,
              name: workoutName,
              description:
                workoutIndex === 0
                  ? "Passe, rececao, finalizacao e modelo de jogo."
                  : "Resistencia, velocidade e prevencao de lesoes.",
              type: workoutIndex === 0 ? "technical" : "physical",
              duration_minutes: workoutIndex === 0 ? 75 : 60,
              objective: workoutIndex === 0 ? "Melhorar tomada de decisao" : "Melhorar capacidade fisica",
              scheduledDate: now + (teamIndex + workoutIndex + 1) * day,
              difficulty: workoutIndex === 0 ? "intermediate" : "advanced",
              status: "scheduled",
              created_at: now,
            }),
          );
        }
      }

      const planName = `Plano semanal - ${seed.name}`;
      const existingPlan = await ensureNamedDocument(ctx, "trainingPlans", planName);
      if (!existingPlan) {
        await ctx.db.insert("trainingPlans", {
          name: planName,
          description: `Plano de treinos demo para ${seed.name}.`,
          coachId: coach.userId,
          workouts: workoutIds,
          duration: 7,
          difficulty: "intermediate",
          goals: ["organizacao coletiva", "condicao fisica", "finalizacao"],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      const trainingDates = [
        { offset: teamIndex + 1, start: "18:30", end: "20:00", title: `Treino coletivo - ${seed.name}` },
        { offset: teamIndex + 4, start: "10:00", end: "11:30", title: `Treino tatico - ${seed.name}` },
      ];
      const existingEvents = await ctx.db.query("events").collect();
      for (const training of trainingDates) {
        if (!existingEvents.some((event) => event.title === training.title)) {
          await ctx.db.insert("events", {
            title: training.title,
            description: `Sessao de treino da ${seed.name}.`,
            date: new Date(now + training.offset * day).toISOString().slice(0, 10),
            start_time: training.start,
            end_time: training.end,
            location: seed.location,
            type: "training",
            user_id: coach.userId,
            created_at: now,
          });
        }
      }
    }

    const fixtures = [
      { home: 0, away: 1, offset: 8, score1: 3, score2: 1 },
      { home: 1, away: 2, offset: 15, score1: 2, score2: 2 },
      { home: 2, away: 0, offset: 22, score1: 1, score2: 4 },
    ];

    for (const fixture of fixtures) {
      const home = teams[fixture.home];
      const away = teams[fixture.away];
      const name = `${home.name} vs ${away.name}`;
      if (!(await ensureNamedDocument(ctx, "games", name))) {
        const gameId = await ctx.db.insert("games", {
          name,
          team1Id: home._id,
          team2Id: away._id,
          date: now + fixture.offset * day,
          location: "Estadio Municipal Demo",
          status: "completed",
          score1: fixture.score1,
          score2: fixture.score2,
          notes: "Jogo demo entre equipas PAP.",
          createdBy: home.coachId,
          createdAt: now,
          updatedAt: now,
        });

        const homePlayers = args.accounts
          .filter((account) => account.teamIndex === fixture.home && account.role === "PLAYER")
          .slice(0, 5);
        for (let index = 0; index < homePlayers.length; index++) {
          await ctx.db.insert("gameStats", {
            gameId,
            playerId: homePlayers[index].userId,
            teamId: home._id,
            points: index === 0 ? 2 : index % 2,
            assists: index % 3,
            rebounds: 0,
            minutesPlayed: 70 + index * 3,
            fouls: index % 2,
            createdAt: now,
          });
        }
      }
    }

    return {
      success: true,
      teams: teamSeeds.length,
      players: args.accounts.filter((account) => account.role === "PLAYER").length,
      coaches: args.accounts.filter((account) => account.role === "COACH").length,
      scouts: args.accounts.filter((account) => account.role === "SCOUT").length,
    };
  },
});
