import { Header } from "@/components/layout/Header";
import { AddNodeWizard } from "@/components/nodes/AddNodeWizard";

export default function AddNodePage() {
  return (
    <div className="min-h-screen">
      <Header 
        title="Add New Node" 
        description="Connect a new server to your monitoring infrastructure"
      />
      
      <div className="p-6">
        <AddNodeWizard />
      </div>
    </div>
  );
}
