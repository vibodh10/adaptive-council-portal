import CouncilPageShell from "@/components/CouncilPageShell";
import ExperienceControls from "@/features/experience/ExperienceControls";
import HousingRepairForm from "@/features/housing-repair/HousingRepairForm";

export default function Home() {
    return (
        <CouncilPageShell>
            <div className="max-w-3xl">
                <ExperienceControls />

                <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
                    <HousingRepairForm />
                </section>
            </div>
        </CouncilPageShell>
    );
}
