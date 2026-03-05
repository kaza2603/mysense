<script setup>
import { computed } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { RouterView, useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
import PageWrapper from '@/components/PageWrapper.vue'
import AdminLayout from '@/components/AdminLayout.vue'
import ParentLayout from '@/components/ParentLayout.vue'
import StudentLayout from '@/components/StudentLayout.vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import KuizLayout from '@/components/KuizLayout.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isParentRoute = computed(
  () =>
    route.path.startsWith('/parent') &&
    !route.path.startsWith('/parent/login') &&
    route.path !== '/parent/register',
)
const isStudentRoute = computed(
  () => route.path.startsWith('/student') && !route.path.startsWith('/student-login'),
)
const isTeacherRoute = computed(
  () => route.path.startsWith('/guru') && !route.path.startsWith('/guru/login'),
)
const isKuizRoute = computed(() => route.path.startsWith('/kuiz'))
</script>

<template>
  <Toaster />
  <template v-if="isAdminRoute">
    <AdminLayout>
      <RouterView />
    </AdminLayout>
  </template>
  <template v-else-if="isParentRoute">
    <ParentLayout>
      <RouterView />
    </ParentLayout>
  </template>
  <template v-else-if="isStudentRoute">
    <StudentLayout>
      <RouterView />
    </StudentLayout>
  </template>
  <template v-else-if="isTeacherRoute">
    <TeacherLayout>
      <RouterView />
    </TeacherLayout>
  </template>
  <template v-else-if="isKuizRoute">
    <KuizLayout>
      <RouterView />
    </KuizLayout>
  </template>
  <template v-else>
    <NavBar />
    <PageWrapper>
      <RouterView />
    </PageWrapper>
    <Footer />
  </template>
</template>
