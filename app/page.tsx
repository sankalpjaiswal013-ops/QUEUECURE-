import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            Welcome to QueueCure
          </h1>
          <p className="text-xl text-slate-600">
            A modern, real-time patient queue management system designed to streamline clinic workflows and improve patient experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Receptionist Portal Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center space-y-6 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Receptionist Portal</h2>
              <p className="text-slate-500">Manage patient check-ins, update statuses, and monitor the queue.</p>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link href="/receptionist">Enter Portal</Link>
            </Button>
          </div>

          {/* Patient Waiting Room Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center space-y-6 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Waiting Room Display</h2>
              <p className="text-slate-500">Public dashboard showing the current queue and now-serving status.</p>
            </div>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/queue">Open Display</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
