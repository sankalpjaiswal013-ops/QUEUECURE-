"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/lib/types";

export default function WaitingRoomPage() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    fetchPatients();

    const subscription = supabase
      .channel("waiting_room_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        () => fetchPatients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .in("status", ["waiting", "in_consultation"])
      .order("status", { ascending: true }) 
      .order("token_number", { ascending: true });

    if (!error && data) {
       // Sort manually: in_consultation first, then waiting by token
       const sorted = data.sort((a, b) => {
        if (a.status === "in_consultation" && b.status === "waiting") return -1;
        if (a.status === "waiting" && b.status === "in_consultation") return 1;
        return a.token_number - b.token_number;
      });
      setPatients(sorted);
    }
  }

  const inConsultation = patients.filter((p) => p.status === "in_consultation");
  const waitingList = patients.filter((p) => p.status === "waiting");

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
          Patient Waiting Room
        </h1>
        <p className="text-slate-400 text-xl">Please check the screen for your token</p>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* In Consultation Section */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
              In Consultation
            </h2>
            
            <div className="space-y-4">
              {inConsultation.length === 0 ? (
                <div className="text-center py-12 text-emerald-500/50">
                  <p className="text-xl font-medium">No one currently being served</p>
                </div>
              ) : (
                inConsultation.map((patient) => (
                  <Card key={patient.id} className="bg-white/10 border-none shadow-xl backdrop-blur-md">
                    <CardContent className="p-6 md:p-8 flex items-center gap-6">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl md:text-4xl font-black shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        #{patient.token_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-emerald-400 font-medium text-sm md:text-base uppercase tracking-wider mb-1">Please Proceed</p>
                        <p className="text-3xl md:text-4xl font-bold text-white truncate">
                          {patient.name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Up Next / Waiting Section */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 h-full">
            <h2 className="text-2xl font-bold text-slate-300 mb-6">Up Next</h2>
            
            <div className="space-y-3">
              {waitingList.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <p className="text-lg">The queue is currently empty.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {waitingList.slice(0, 8).map((patient, index) => (
                    <div 
                      key={patient.id} 
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        index === 0 ? 'bg-slate-700/80 border border-slate-600' : 'bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          #{patient.token_number}
                        </div>
                        <div>
                          <p className={`font-semibold ${index === 0 ? 'text-xl text-white' : 'text-lg text-slate-300'}`}>
                            {patient.name}
                          </p>
                          {index === 0 && <p className="text-blue-400 text-sm font-medium">You are next!</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {waitingList.length > 8 && (
                    <div className="text-center pt-4 text-slate-500 text-sm font-medium">
                      + {waitingList.length - 8} more people waiting
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
