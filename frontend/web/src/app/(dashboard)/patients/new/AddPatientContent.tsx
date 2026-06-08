"use client";

import { useState } from "react";
import Link from "next/link";

export function AddPatientContent() {
  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-8">
      {/* Header with back */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <Link href="/patients" className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[rgba(255,255,255,0.05)]">
            <svg className="w-4 h-4 text-[#C1C7CF]" viewBox="0 0 16 16" fill="currentColor"><path d="M15 7H4.41l5.3-5.29L8 0 0 8l8 8 1.71-1.71L4.41 9H15V7z"/></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.6px] text-[#E1E2E6]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Add Patient Profile</h1>
            <p className="text-sm text-[#C1C7CF]">Enter the patient&apos;s personal and contact information to create a new record.</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="rounded-[24px] bg-[rgba(25,28,31,0.4)] border border-[rgba(255,255,255,0.1)] shadow-[0px_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px]">
        <div className="p-8 flex flex-col gap-10">
          {/* Basic Information */}
          <section>
            <div className="flex items-center gap-3 pb-3 mb-6 border-b border-[rgba(255,255,255,0.05)]">
              <svg className="w-[16.67px] h-[16.67px] text-[#92CDFD]" viewBox="0 0 17 17" fill="currentColor"><path d="M8.5 0a8.5 8.5 0 100 17 8.5 8.5 0 000-17z"/></svg>
              <h2 className="text-lg font-semibold text-[#92CDFD]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Basic Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <Field label="Full Name *" placeholder="Enter patient name" />
              <Field label="Patient Code" placeholder="Auto-generated" value="PT-24901-A" icon={
                <svg className="w-[10.5px] h-[9.33px] text-[#41474E]" viewBox="0 0 11 10" fill="currentColor"><path d="M5.5 0L11 10H0z"/></svg>
              } />
              <Field label="Date of Birth *" placeholder="mm/dd/yyyy" type="date" />
              <div>
                <Label text="Gender *" />
                <div className="flex items-center gap-4 mt-2">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="gender" className="w-4 h-4 rounded-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.2)] accent-[#92CDFD]" />
                      <span className="text-sm text-[#E1E2E6]">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <SelectField label="Blood Type" placeholder="Select Type" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <div className="flex items-center gap-3 pb-3 mb-6 border-b border-[rgba(255,255,255,0.05)]">
              <svg className="w-5 h-[15px] text-[#92CDFD]" viewBox="0 0 20 15" fill="currentColor"><path d="M10 0L0 4v11h20V4L10 0zm0 2.18L16.06 5 10 7.82 3.94 5 10 2.18z"/></svg>
              <h2 className="text-lg font-semibold text-[#92CDFD]" style={{ fontFamily: "'Public Sans', sans-serif" }}>Contact Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <Field label="Phone *" placeholder="+84" icon={
                <svg className="w-[10.5px] h-[10.5px] text-[#41474E]" viewBox="0 0 11 11" fill="currentColor"><path d="M10.5 7.5l-3-1.5L6 7.5C4.5 6 3.5 5 2 3.5L3.5 2 2 0H0v1C0 6.5 4.5 11 10 11h1V8.5z"/></svg>
              } />
              <Field label="Email" placeholder="patient@example.com" icon={
                <svg className="w-[11.67px] h-[9.33px] text-[#41474E]" viewBox="0 0 12 10" fill="currentColor"><path d="M6 0L0 4v6h12V4L6 0z"/></svg>
              } />
              <div className="col-span-2">
                <Label text="Address" />
                <input type="text" placeholder="Street address, apartment, suite" className="mt-2 w-full h-[46px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-base text-[#E1E2E6] placeholder:text-[#41474E] outline-none" />
              </div>
              <SelectField label="City/Province" placeholder="Select City" options={["San Francisco", "Los Angeles", "New York"]} />
              <SelectField label="District" placeholder="Select District" options={["District 1", "District 2", "District 3"]} disabled />
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-4 px-8 py-6 rounded-b-[24px] bg-[rgba(50,53,56,0.8)] border-t border-[rgba(255,255,255,0.1)] backdrop-blur-[6px]">
          <Link href="/patients" className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#E1E2E6] border border-[rgba(255,255,255,0.1)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Cancel
          </Link>
          <button className="px-6 py-2.5 rounded-full bg-[#92CDFD] text-sm font-semibold text-[#003450]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Save Patient Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <span className="text-sm text-[#C1C7CF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{text}</span>;
}

function Field({ label, placeholder, value, type, icon }: { label: string; placeholder: string; value?: string; type?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <Label text={label} />
      <div className="relative mt-2">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input type={type || "text"} defaultValue={value} placeholder={placeholder} className={`w-full h-[46px] ${icon ? "pl-9" : "px-4"} pr-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-base text-[#E1E2E6] placeholder:text-[#41474E] outline-none shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)]`} />
      </div>
    </div>
  );
}

function SelectField({ label, placeholder, options, disabled }: { label: string; placeholder: string; options: string[]; disabled?: boolean }) {
  return (
    <div>
      <Label text={label} />
      <div className={`relative mt-2 ${disabled ? "opacity-50" : ""}`}>
        <select disabled={disabled} className="w-full h-[46px] px-4 rounded-[12px] bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] text-base text-[#E1E2E6] appearance-none outline-none shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)] cursor-pointer">
          <option value="" className="text-[#41474E]">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-[7.4px] text-[#41474E]" viewBox="0 0 12 8" fill="currentColor"><path d="M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z"/></svg>
        </div>
      </div>
    </div>
  );
}
