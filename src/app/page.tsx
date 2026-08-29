import CouncilPageShell from "@/components/CouncilPageShell";
import ExperienceControls from "@/features/experience/ExperienceControls";
import HousingRepairForm from "@/features/housing-repair/HousingRepairForm";

export default function Home() {
    return (
        <CouncilPageShell>
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,48rem)_minmax(16rem,20rem)] lg:gap-10 xl:gap-14">
                <section
                    aria-label="Housing repair form"
                    className="border-t-8 border-civic-accent bg-civic-surface px-5 py-7 outline outline-1 outline-civic-line sm:px-8 sm:py-10 lg:col-start-1 lg:row-start-1 lg:px-12 lg:py-12"
                >
                    <a
                        href="#page-support"
                        className="mb-7 inline-flex border-b-2 border-civic-accent pb-1 font-bold text-civic-accent-dark hover:border-civic-ink hover:text-civic-ink lg:hidden"
                    >
                        Make this page easier for me ↓
                    </a>
                    <HousingRepairForm />
                </section>

                <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
                    <ExperienceControls />
                </aside>
            </div>
        </CouncilPageShell>
    );
}
