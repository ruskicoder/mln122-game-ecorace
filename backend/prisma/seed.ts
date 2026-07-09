import { PrismaClient, RoomStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const testRoomId = 'TEST01';
  
  // Clean up existing data for seed idempotency
  await prisma.roundAction.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.room.deleteMany({});

  const room = await prisma.room.create({
    data: {
      id: testRoomId,
      status: RoomStatus.LOBBY,
      currentRound: 1,
      maxRounds: 5,
      macroBudget: 100.0,
    },
  });

  const admin = await prisma.player.create({
    data: {
      username: 'GiangVienAdmin',
      socketId: 'temp-socket-admin-id',
      isAdmin: true,
      role: null,
      capital: 100.0,
      roomId: testRoomId,
    },
  });

  console.log(`Database seeded successfully! Room: ${room.id}, Admin Player ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
