"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Patient, ClinicSettings } from "@/lib/types";

import { toast } from "sonner";

// Helper for debouncing
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function ReceptionistPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doneToday, setDoneToday] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Security State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  
  const [name, setName] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchPatients = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      toast.error("Failed to load patients");
      return;
    }

    if (data) {
      const active = data
        .filter((p) => p.status !== "done")
        .sort((a, b) => {
          if (a.is_priority && !b.is_priority) return -1;
          if (!a.is_priority && b.is_priority) return 1;
          return a.token_number - b.token_number;
        });
      const done = data.filter((p) => p.status === "done");
      
      setPatients(active);
      setDoneToday(done);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase.from("clinic_settings").select("*").eq("id", 1).single();
    if (error) {
      toast.error("Failed to load settings");
      return;
    }
    if (data) setSettings(data);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchPatients(), fetchSettings()]);
      setIsLoading(false);
    };
    init();

    const patientSub = supabase
      .channel("patients_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => {
        fetchPatients();
      })
      .subscribe();

    const settingsSub = supabase
      .channel("settings_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "clinic_settings" }, (payload) => {
        // Only fetch settings if modified externally to avoid resetting local optimistic state
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(patientSub);
      supabase.removeChannel(settingsSub);
    };
  }, []);

  // -- Actions --

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !settings) return;

    const nextToken = settings.current_token + 1;

    // Optimistic or simultaneous updates
    const { error: settingsError } = await supabase.from("clinic_settings").update({ current_token: nextToken }).eq("id", 1);
    if (settingsError) {
      toast.error("Failed to assign token number.");
      return;
    }
    
    const { error } = await supabase.from("patients").insert([
      { name: name.trim(), token_number: nextToken, status: "waiting", is_priority: isPriority }
    ]);
    if (error) {
      toast.error("Failed to add patient to queue.");
      return;
    }
    toast.success(`${name.trim()} added (Token #${nextToken})`);

    setName("");
    setIsPriority(false);
    inputRef.current?.focus();
    
    // Explicitly update UI immediately (fallback if Realtime is disabled in Supabase)
    fetchPatients();
    fetchSettings();
  };

  const handleCallNext = async () => {
    const waiting = patients.filter(p => p.status === "waiting");
    if (waiting.length === 0) return;
    
    const nextPatient = waiting[0];
    const { error } = await supabase
      .from("patients")
      .update({ status: "in_consultation", called_at: new Date().toISOString() })
      .eq("id", nextPatient.id);
      
    if (error) {
      toast.error("Failed to call next patient.");
    } else {
      toast.success(`Calling Token #${nextPatient.token_number}`);
      fetchPatients();
    }
  };

  const handleMarkDone = async (id: string) => {
    const { error } = await supabase
      .from("patients")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", id);
      
    if (error) {
      toast.error("Failed to mark patient as done.");
    } else {
      fetchPatients();
    }
  };

  // -- Debounced Settings Update --

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateAvgConsultation = useCallback(
    debounce(async (val: number) => {
      const { error } = await supabase.from("clinic_settings").update({ avg_consultation_minutes: val }).eq("id", 1);
      if (error) toast.error("Failed to save settings");
    }, 600),
    []
  );

  const handleAvgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    setSettings((s) => s ? { ...s, avg_consultation_minutes: val } : null);
    updateAvgConsultation(val);
  };

  // -- Derived Stats --

  const hasWaiting = patients.some(p => p.status === "waiting");
  
  const avgWaitTime = doneToday.length > 0 
    ? Math.round(
        doneToday.reduce((acc, p) => {
          if (p.completed_at && p.called_at) {
            const diffMs = new Date(p.completed_at).getTime() - new Date(p.called_at).getTime();
            return acc + (diffMs / 60000);
          }
          return acc;
        }, 0) / doneToday.length
      )
    : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
        <Card className="w-full max-w-sm border-slate-200 shadow-sm rounded-3xl">
          <CardHeader className="text-center pb-4 pt-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <CardTitle className="text-2xl font-bold">Staff Access</CardTitle>
            <CardDescription className="text-base mt-2">Enter the clinic PIN to manage the queue.</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (pin === "1234") {
                setIsAuthenticated(true);
                toast.success("Access granted");
              } else {
                toast.error("Incorrect PIN");
                setPin("");
              }
            }} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-xl tracking-widest h-12"
                autoFocus
              />
              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg h-12">
                Unlock Portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-medium">Loading reception portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Receptionist Portal</h1>
            <p className="text-slate-500 mt-1">Manage intake and monitor consultations</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Patients Done</p>
              <p className="text-2xl font-bold text-emerald-600">{doneToday.length}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg Consult</p>
              <p className="text-2xl font-bold text-blue-600">{avgWaitTime} <span className="text-sm font-medium text-slate-400">min</span></p>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Add Patient Form */}
          <Card className="border-slate-100 shadow-sm rounded-2xl flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle>Add Patient</CardTitle>
              <CardDescription>Assign the next token to a new arrival</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <form onSubmit={handleAddPatient} className="flex flex-col gap-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Patient Name
                    </Label>
                    <Input
                      ref={inputRef}
                      placeholder="Enter full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full font-medium"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!name.trim() || !settings}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap h-9 px-4"
                  >
                    Add & Assign Token
                  </Button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={isPriority} 
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-600">Priority / Emergency</span>
                </label>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions & Settings */}
          <Card className="border-slate-100 shadow-sm rounded-2xl flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle>Actions & Settings</CardTitle>
              <CardDescription>Call patients and adjust wait times</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Est. Consultation (min)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings?.avg_consultation_minutes || 15}
                    onChange={handleAvgChange}
                    className="w-full text-center font-medium"
                  />
                </div>
                <Button 
                  onClick={handleCallNext} 
                  disabled={!hasWaiting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap h-9 px-4"
                >
                  Call Next Patient
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Live Patient Table */}
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle>Active Queue</CardTitle>
          </CardHeader>
          <div className="bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] pl-6">Token</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                      No active patients in the queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6 font-bold text-slate-900">
                        #{p.token_number}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          {p.name}
                          {p.is_priority && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Priority</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.status === "in_consultation" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In Consultation
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Waiting
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {p.status === "in_consultation" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleMarkDone(p.id)}
                          >
                            Mark Done
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

      </div>
    </div>
  );
}
