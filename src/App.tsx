import './App.css'
import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <h1>This is Ondrej</h1>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
