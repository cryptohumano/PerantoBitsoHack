import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMultipleRoles() {
  try {
    console.log('🔧 Agregando múltiples roles a usuarios...');

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      include: {
        roles: true
      }
    });

    console.log(`📊 Encontrados ${users.length} usuarios`);

    for (const user of users) {
      console.log(`\n👤 Procesando usuario: ${user.did}`);
      console.log(`Roles actuales: ${user.roles.map(r => r.role).join(', ')}`);

      // Determinar qué roles agregar basado en los roles existentes
      let newRoles: string[] = [];
      
      if (user.roles.some(r => r.role === 'ATTESTER')) {
        newRoles = ['USER', 'ATTESTER'];
        console.log('➕ Agregando roles: USER, ATTESTER');
      } else if (user.roles.some(r => r.role === 'ADMIN')) {
        newRoles = ['USER', 'ADMIN'];
        console.log('➕ Agregando roles: USER, ADMIN');
      } else {
        newRoles = ['USER'];
        console.log('➕ Agregando rol: USER');
      }

      // Eliminar roles existentes y crear los nuevos
      await prisma.userRole.deleteMany({
        where: { userId: user.id }
      });

      await prisma.userRole.createMany({
        data: newRoles.map(role => ({
          userId: user.id,
          role: role as any
        }))
      });

      console.log(`✅ Roles actualizados para ${user.did}`);
    }

    console.log('\n🎉 Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMultipleRoles(); 