"use client"

import { useState, useEffect } from "react"
import gameData from "../data/gameEngine.json"
import { getInitialState, applyOption, GameState } from "../lib/gameEngine"

export default function Home() {

  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200)
    }
  
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const [state, setState] = useState<GameState | null>(null)

  useEffect(() => {
    setState(getInitialState())
  }, [])

  if (!state || !state.node) return null

  const node = gameData.nodes[state.node]
  const background = getBackground(state.node)

  if (!node) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        Invalid node: {state.node}
      </div>
    )
  }

  let displayText = node.text || ""

  if (node.text_by_persona)
    displayText = node.text_by_persona[state.persona] || displayText

  if (node.text_by_location)
    displayText = node.text_by_location[state.location] || displayText

  displayText = renderText(displayText, state)
  const isOutcome = !!state.outcome

  /* ================= OUTCOME ================= */

  if (isOutcome) {
    return (
      <div className={`min-h-screen ${background} text-white`}>
        <TopDashboard state={state} />

        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-black/60 p-10 rounded-3xl shadow-2xl">

            <h1 className="text-4xl font-bold mb-4">
              {state.outcome}
            </h1>

            <p className="mb-6 text-gray-200 text-lg">
              {state.outcomeDescription}
            </p>

            <LiteracyPanel state={state} />
            <SkillPanel state={state} />

            <button
              className="mt-8 w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition"
              onClick={() => setState(getInitialState())}
            >
              Restart
            </button>

          </div>
        </div>

    {/* Scroll To Top Button */}
    {showScrollTop && (
      <button
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }}
        className="fixed bottom-6 right-6 z-50 
                   px-4 py-3 rounded-full 
                   bg-black/70 backdrop-blur-md 
                   text-white shadow-lg 
                   hover:bg-black/90 transition"
      >
        ↑ Top
      </button>
    )}

  </div>
  )
  }

/* ================= NORMAL ================= */

return (
  <div className={`min-h-screen ${background} text-white`}>

    <TopDashboard state={state} />

    <div className="max-w-4xl mx-auto p-8">

      {/* Narrative Text Block */}
      <div className="mb-8 p-8 bg-black/60 rounded-3xl shadow-2xl text-lg leading-relaxed whitespace-pre-line">
        {displayText}
      </div>

      {/* ================= NARRATIVE ================= */}
      {node.type === "narrative" && (
        <button
          className="w-full p-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-lg transition active:scale-[0.98]"
          onClick={() => setState(applyOption(state))}
        >
          Continue →
        </button>
      )}

      {/* ================= DECISION ================= */}
      {node.type === "decision" &&
        node.options?.map((option: any) => {

          const lockedByFlag =
            option.requires_flag &&
            !state.flags.includes(option.requires_flag)

          const lockedByValue =
            option.requires_value &&
            Object.entries(option.requires_value).some(
              ([key, rule]: any) => {

                const value =
                  state[key as keyof GameState] as number | undefined

                if (typeof value !== "number") return false

                if (rule.min !== undefined && value < rule.min)
                  return true

                if (rule.max !== undefined && value > rule.max)
                  return true

                return false
              }
            )

          const locked = Boolean(lockedByFlag || lockedByValue)

          return (
            <button
              key={option.id}
              disabled={locked}
              className={`block w-full mb-4 p-5 rounded-2xl shadow-lg text-left transition
                ${locked
                  ? "bg-gray-600 opacity-50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98]"
                }`}
              onClick={() => {
                if (!locked) {
                  setState(applyOption(state, option))
                }
              }}
            >
              {option.label}
            </button>
          )
        })
      }

    </div>

    {/* ================= SCROLL TO TOP BUTTON ================= */}
    {showScrollTop && (
      <button
        onClick={() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }}
        className="fixed bottom-6 right-6 z-50 
                   px-4 py-3 rounded-full 
                   bg-black/70 backdrop-blur-md 
                   text-white shadow-lg 
                   hover:bg-black/90 transition"
      >
        ↑ Top
      </button>
    )}

  </div>
)
}

/* ========================================================= */
/* DASHBOARD */
/* ========================================================= */

function TopDashboard({ state }: { state: GameState }) {

  const personaText =
    (gameData as any).persona_info?.[state.persona] || ""

  const locationText =
    (gameData as any).location_info?.[state.location] || ""

  const vars = gameData.system.variables

  const riskLevel =
    state.HR === 0
      ? "Stable"
      : state.HR <= 2
      ? "Elevated"
      : "Critical"

  return (
    <div className="relative bg-black/80 border-b border-white/10">

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-1">

      <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">

{/* Persona Section */}
<div>
  <span className="inline-block px-5 py-2 bg-indigo-600/30 rounded-full text-base font-semibold mb-2">
    {state.persona}
  </span>

  <div className="text-base text-gray-200 leading-relaxed">
    {personaText}
  </div>
</div>

{/* Location Section */}
<div>
  <span className="inline-block px-5 py-2 bg-emerald-600/30 rounded-full text-base font-semibold mb-2">
    {state.location}
  </span>

  <div className="text-base text-gray-200 leading-relaxed">
    {locationText}
  </div>
</div>

</div>

        <div className="bg-white/5 p-1 rounded-xl border border-white/10">

          <div className="flex justify-between mb-2 text-xs uppercase tracking-wide text-gray-400">
          <span className="text-gray-400">Status</span>
          </div>

          <BalancedStat
            label="Safety"
            value={state.S}
            min={vars.S.min}
            max={vars.S.max}
            colorPositive="bg-blue-500"
            colorNegative="bg-red-700"
          />

          <BalancedStat
            label="Resources"
            value={state.R}
            min={vars.R.min}
            max={vars.R.max}
            colorPositive="bg-blue-500"
            colorNegative="bg-red-700"
          />

          <BalancedStat
            label="Mobility"
            value={state.M}
            min={vars.M.min}
            max={vars.M.max}
            colorPositive="bg-blue-500"
            colorNegative="bg-red-700"
          />

          <BalancedStat
            label="Social Capital"
            value={state.SC}
            min={vars.SC.min}
            max={vars.SC.max}
            colorPositive="bg-blue-500"
            colorNegative="bg-red-700"
          />

          {/* High Risk */}
          <div className="mt-3 pt-3 border-t border-white/20">

            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
              Hazard Accumulation
            </div>

            <div className="flex justify-between text-sm mb-1">
              <span>High Risk</span>
              <span>{state.HR}</span>
            </div>

            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-600 h-3 transition-all duration-300"
                style={{
                  width: `${(state.HR / (vars.HR.max || 1)) * 100}%`
                }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

/* ========================================================= */
/* BALANCED STAT */
/* ========================================================= */

function BalancedStat({
  label,
  value,
  min,
  max,
  colorPositive,
  colorNegative
}: any) {

  const range = max - min || 1
  const zeroPosition = Math.abs(min) / range
  const percent = (value - min) / range

  return (
    <div className="mb-2">

      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="relative w-full h-2 bg-white/10 rounded-full">

        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/40"
          style={{ left: `${zeroPosition * 100}%` }}
        />

        {value >= 0 ? (
          <div
            className={`absolute top-0 h-2 ${colorPositive}`}
            style={{
              left: `${zeroPosition * 100}%`,
              width: `${Math.max(0, (percent - zeroPosition) * 100)}%`
            }}
          />
        ) : (
          <div
            className={`absolute top-0 h-2 ${colorNegative}`}
            style={{
              left: `${percent * 100}%`,
              width: `${Math.max(0, (zeroPosition - percent) * 100)}%`
            }}
          />
        )}

      </div>
    </div>
  )
}

/* ========================================================= */

function LiteracyPanel({ state }: { state: GameState }) {

  const earned = state.literacyDetails || []

  return (
    <div className="mb-8 p-6 rounded-2xl bg-green-600/20 border border-green-400">
      <h2 className="text-xl font-semibold mb-3">
        Disaster Literacy Score
      </h2>

      <div className="text-3xl font-bold mb-6">
        {state.literacyScore} / {state.maxLiteracyScore}
      </div>

      {earned.map((item) => (
        <div
          key={item.id}
          className="p-4 rounded-xl bg-green-500/20 border border-green-400 mb-3"
        >
          <div className="font-semibold mb-1">
            {item.dimension}
          </div>
          <div className="text-sm text-gray-200">
            {item.explanation}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ========================================================= */

function SkillPanel({ state }: { state: GameState }) {

  const skills = gameData.system.skills

  let label = ""
  let value = 0
  let min = 0
  let max = 1
  let color = ""

  if (state.location === "Coastal") {
    label = "Surge Awareness"
    value = state.SA
    min = skills.SA.min
    max = skills.SA.max
    color = "bg-purple-400"
  }

  if (state.location === "River") {
    label = "Flood Management"
    value = state.FM
    min = skills.FM.min
    max = skills.FM.max
    color = "bg-cyan-400"
  }

  if (state.location === "Hill") {
    label = "Landslide Awareness"
    value = state.LA
    min = skills.LA.min
    max = skills.LA.max
    color = "bg-orange-400"
  }

  return (
    <div className="mt-6 p-6 rounded-2xl bg-white/10">
      <Stat label={label} value={value} min={min} max={max} color={color} />
    </div>
  )
}

/* ========================================================= */

function Stat({ label, value, min, max, color }: any) {

  const range = max - min || 1
  const normalized = (value - min) / range
  const width = Math.max(0, Math.min(100, normalized * 100))

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
        <div
          className={`${color} h-3 transition-all duration-300`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}


/* =========================================================
   🔥 TEXT RENDER FUNCTION
========================================================= */

function renderText(text: string, state: GameState) {
  return text
    .replaceAll("{S}", String(state.S))
    .replaceAll("{R}", String(state.R))
    .replaceAll("{M}", String(state.M))
    .replaceAll("{SC}", String(state.SC))
    .replaceAll("{HR}", String(state.HR))
    .replaceAll("{SA}", String(state.SA))
    .replaceAll("{FM}", String(state.FM))
    .replaceAll("{LA}", String(state.LA))
}

/* ========================================================= */

function getBackground(node?: string) {

  if (!node) return "bg-gradient-to-br from-black to-gray-900"

  if (node.startsWith("DAY0"))
    return "bg-gradient-to-br from-indigo-900 to-slate-900"

  if (node.startsWith("DAY1"))
    return "bg-gradient-to-br from-sky-900 to-slate-800"

  if (node.startsWith("DAY2"))
    return "bg-gradient-to-br from-slate-900 to-gray-900"

  if (node.startsWith("DAY3"))
    return "bg-gradient-to-br from-gray-800 to-slate-700"

  return "bg-gradient-to-br from-black to-gray-900"
}