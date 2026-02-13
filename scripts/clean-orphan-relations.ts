import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║     LIMPAR REGISTROS ÓRFÃOS - TABELAS DE VÍNCULO           ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  
  console.log('📊 Verificando registros...\n')
  
  try {
    // Contar registros em cada tabela
    const planBenefitCount = await prisma.planBenefit.count()
    const benefitAccessCount = await prisma.benefitAccess.count()
    const planCount = await prisma.plan.count()
    const parceiroCount = await prisma.parceiro.count()
    const benefitCount = await prisma.benefit.count()
    
    console.log('┌─────────────────┬──────────┐')
    console.log('│ Tabela          │ Registros│')
    console.log('├─────────────────┼──────────┤')
    console.log(`│ PlanBenefit     │ ${String(planBenefitCount).padStart(8)} │`)
    console.log(`│ BenefitAccess   │ ${String(benefitAccessCount).padStart(8)} │`)
    console.log(`│ Plan            │ ${String(planCount).padStart(8)} │`)
    console.log(`│ Parceiro        │ ${String(parceiroCount).padStart(8)} │`)
    console.log(`│ Benefit         │ ${String(benefitCount).padStart(8)} │`)
    console.log('└─────────────────┴──────────┘\n')
    
    if (planBenefitCount > 0 || benefitAccessCount > 0) {
      console.log('🧹 Limpando tabelas de vínculo...\n')
      
      // Limpar PlanBenefit
      const deletedPlanBenefits = await prisma.planBenefit.deleteMany({})
      console.log(`✅ PlanBenefit: ${deletedPlanBenefits.count} registros removidos`)
      
      // Limpar BenefitAccess
      const deletedBenefitAccess = await prisma.benefitAccess.deleteMany({})
      console.log(`✅ BenefitAccess: ${deletedBenefitAccess.count} registros removidos`)
      
      console.log('\n╔════════════════════════════════════════════════════════════╗')
      console.log('║  🎉 LIMPEZA CONCLUÍDA! Benefícios podem ser excluídos.    ║')
      console.log('╚════════════════════════════════════════════════════════════╝\n')
    } else {
      console.log('✅ Tabelas de vínculo já estão vazias.\n')
      console.log('╔════════════════════════════════════════════════════════════╗')
      console.log('║  ℹ️  Nenhuma limpeza necessária.                           ║')
      console.log('╚════════════════════════════════════════════════════════════╝\n')
    }
  } catch (error) {
    console.error('\n❌ Erro ao limpar tabelas:', error)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
