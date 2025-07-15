import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creando usuario administrador...');
    
    // DID del administrador (debes reemplazar con el DID real)
    const adminDid = process.env.ADMIN_DID || 'did:kilt:4peaXN7LLzwdcprxRaritPhZvcXMKMW6mU4TJ4qrpewFvAZ7';
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { did: adminDid },
      include: { roles: true }
    });

    if (existingUser) {
      console.log('El usuario ya existe. Actualizando roles...');
      
      // Eliminar roles existentes y crear nuevos
      await prisma.userRole.deleteMany({
        where: { userId: existingUser.id }
      });
      
      const updatedUser = await prisma.user.update({
        where: { did: adminDid },
        data: { 
          roles: {
            create: [
              { role: 'USER' },
              { role: 'ATTESTER' },
              { role: 'ADMIN' }
            ]
          }
        },
        include: { roles: true }
      });
      
      console.log('Usuario actualizado exitosamente:');
      console.log('DID:', updatedUser.did);
      console.log('Roles:', updatedUser.roles.map(r => r.role));
      console.log('ID:', updatedUser.id);
    } else {
      console.log('Creando nuevo usuario administrador...');
      
      const newUser = await prisma.user.create({
        data: {
          did: adminDid,
          roles: {
            create: [
              { role: 'USER' },
              { role: 'ATTESTER' },
              { role: 'ADMIN' }
            ]
          }
        },
        include: { roles: true }
      });
      
      console.log('Usuario administrador creado exitosamente:');
      console.log('DID:', newUser.did);
      console.log('Roles:', newUser.roles.map(r => r.role));
      console.log('ID:', newUser.id);
    }
    
    console.log('\n¡Usuario administrador configurado correctamente!');
    console.log('Puedes usar este DID para acceder al panel de administración.');
    
  } catch (error) {
    console.error('Error creando usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createAdmin(); 