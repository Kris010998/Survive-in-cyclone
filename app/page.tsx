"use client"

import { useState, useEffect } from "react"
import gameData from "../data/gameEngine.json"
import { getInitialState, applyOption, GameState } from "../lib/gameEngine"

export default function Home() {

  // 1️⃣ 所有 hooks 先声明

  const [gameStarted, setGameStarted] = useState(false)

  const [showScrollTop, setShowScrollTop] = useState(false)

  const [state, setState] = useState<GameState | null>(null)

  const [introStep, setIntroStep] = useState<"persona" | "location" | "done">("persona")

  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [showPersonaCard, setShowPersonaCard] = useState(false)
  
  const [showLocationCard, setShowLocationCard] = useState(false)
  
  // 2️⃣ useEffect

  useEffect(() => {
    if (!gameStarted) return
  
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200)
    }
  
    window.addEventListener("scroll", handleScroll)
  
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [gameStarted])

  useEffect(() => {
    if (gameStarted) {
      setState(getInitialState())
    }
  }, [gameStarted])

  if (!gameStarted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center text-white text-center overflow-hidden">
  
        {/* Background Image */}
        <img
          src="/images/start-bg.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        />
  
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
  
        {/* Content */}
        <div className="relative z-10 px-6">
  
          <h1 className="text-5xl font-bold mb-6">
            Decision Under Disaster
          </h1>
  
          <p className="text-lg text-gray-200 max-w-xl mb-10 leading-relaxed">
          A Scenario-Based Simulation for Disaster Literacy in Asia-Pacific.
          Experience a 3-Day Crisis in Sri Lanka.
          Your decisions influence risk, resources, and survival.
          </p>
  
          <button
          onClick={() => setGameStarted(true)}
          className="
            relative px-6 py-2 
            rounded-4xl text-lg font-semibold 
            text-white
            bg-gradient-to-r from-indigo-600 to-purple-600
            shadow-lg shadow-indigo-900/40
            transition-all duration-300
            hover:scale-105 hover:shadow-xl hover:shadow-indigo-900/60
            active:scale-90
          "
        >
          Start
        </button>
  
        </div>
  
      </div>
    )
  }


  if (!state || !state.node) return null

  const narrativeBg = getNarrativeBackground(state)

  // 3️⃣ 再写依赖 state 的变量
  const isLocationBranch =
  state.node.startsWith(state.location?.toUpperCase())

  const showLocationBackground =
  introStep === "location" ||
  state.node === "DAY0_LOCATION" ||
  isLocationBranch

  type PersonaInfo = {
    image: string
    description: string
  }
  
  const personaData: PersonaInfo | undefined =
    (gameData as any).persona_info?.[state.persona]

  const locationInfo =
    (gameData as any).location_info?.[state.location]

  const node = gameData.nodes[state.node as keyof typeof gameData.nodes]  


  if (!node) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        Invalid node: {state.node}
      </div>
    )
  }

  let displayText =
  "text" in node && typeof node.text === "string"
    ? node.text
    : ""

  if ("text_by_persona" in node && node.text_by_persona) {
    displayText =
      (node.text_by_persona as Record<string, string>)[state.persona] ||
      displayText
  }

  if ("text_by_location" in node && node.text_by_location) {
    displayText =
      (node.text_by_location as Record<string, string>)[state.location] ||
      displayText
  }

  displayText = renderText(displayText, state)
  const isOutcome = !!state.outcome

  
  /* ================= OUTCOME ================= */

  if (isOutcome) {
    return (
      <div className="relative min-h-screen text-white overflow-hidden">

      {/* Location Background */}
      {locationInfo?.image && (
        <img
          src={locationInfo.image}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Content Layer */}
      <div className="relative z-10">

      <TopDashboard
        state={state}
        setPreviewImage={setPreviewImage}
        setShowPersonaCard={setShowPersonaCard}
        setShowLocationCard={setShowLocationCard}
      />

        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-black/50 p-10 rounded-3xl shadow-2xl">

            <h1 className="text-2xl md:text-4xl font-bold mb-4">
              {state.outcome}
            </h1>

            <p className="mb-6 text-gray-200 text-base md:text-lg leading-relaxed">
              {state.outcomeDescription}
            </p>

            <LiteracyPanel state={state} />
            <SkillPanel state={state} />

            <button
            className="mt-8 w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition"
            onClick={() => {
              setState(null)
              setIntroStep("persona")
              setGameStarted(false)
            }}
          >
            Restart
          </button>

          </div>
        
          {previewImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
              onClick={() => setPreviewImage(null)}
            >
              <img
                src={previewImage}
                className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
              />
            </div>
          )}
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
</div>
  )
  }

  const getContinueLabel = () => {
    if (!state?.node) return "Continue →"
  
    const stormNodes = ["COASTAL_2", "RIVER_2", "HILL_2"]
  
    if (stormNodes.includes(state.node)) {
      return "The Storm Is Approaching →"
    }
  
    return "Continue →"
  }



  function getNarrativeBackground(state: GameState) {
    const node = state?.node
    if (!node) return "/images/narratives/default.jpg"
  
    // ===== 精确节点（最高优先级） =====
  
    if (node === "DAY1_START_1")
    return "/images/narratives/day1.jpg"

    if (node === "DAY1_WARNING")
      return "/images/narratives/day1_warning.jpg"
  
    if (node === "DAY1_PREP")
      return "/images/narratives/day1_prep.jpg"
  
  
    // ===== 事件冲击阶段（优先于 location 引入） =====
  
    if (node === "COASTAL_EVENT")
      return "/images/events/coastal_impact.jpg"
  
    if (node === "RIVER_EVENT")
      return "/images/events/river_impact.jpg"
  
    if (node === "HILL_EVENT")
      return "/images/events/hill_impact.jpg"

    if (node === "DAY3_WATER")
      return "/images/events/water.jpg"

    if (node === "DAY3_COMMUNITY")
      return "/images/events/community.jpg"
  
  
    // ===== 地点引入阶段 =====
  
    if (
      node.startsWith("COASTAL_") ||
      node.startsWith("RIVER_") ||
      node.startsWith("HILL_")
    ) {
      return `/images/locations/${state.location?.toLowerCase()}.jpg`
    }
  
  
    // ===== DAY1 阶段 =====
  
    if (node.startsWith("DAY1"))
      return "/images/narratives/day1.jpg"
  
  
    // ===== DAY2 阶段 =====
  
    if (node.startsWith("DAY2"))
      return "/images/narratives/day2.jpg"
  
  
    // ===== Shelter =====
  
    if (node.startsWith("SHELTER"))
      return "/images/narratives/shelter.jpg"
  
  
    // ===== DAY3 =====
  
    if (node.startsWith("DAY3"))
      return "/images/narratives/day3.jpg"
  
  
    return null
  }


/* ================= NORMAL ================= */

return (
  <div className="relative min-h-screen text-white overflow-hidden">

  {/* Background Layer */}
  {narrativeBg ? (
    <img
      src={narrativeBg}
      className="absolute inset-0 w-full h-full object-cover"
    />
  ) : locationInfo?.image && showLocationBackground ? (
    <img
      src={locationInfo.image}
      className="absolute inset-0 w-full h-full object-cover"
    />
  ) : (
    <div className="absolute inset-0 bg-slate-900" />
  )}

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />


  {/* Content Layer */}
  <div className="relative z-10">

    {/* Persona Modal */}
    {introStep === "persona" && personaData?.description && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-900 p-10 rounded-3xl max-w-lg w-full shadow-2xl text-center">

          {/* Image */}
          {personaData.image && (
            <img
              src={personaData.image}
              alt={String(state.persona)}
              className="mx-auto mb-6 w-64 h-auto rounded-xl"
            />
          )}

          {/* Persona Name */}
          <h2 className="text-2xl font-bold mb-4">
            {String(state.persona)}
          </h2>

          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            {String(personaData.description)}
          </p>

          {/* Confirm Button */}
          <button
            className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
            onClick={() => setIntroStep("location")}
          >
            Confirm
          </button>

        </div>
      </div>
    )}

    {introStep === "location" && locationInfo && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-slate-900 p-10 rounded-3xl max-w-lg w-full shadow-2xl text-center">

          {locationInfo.image && (
            <img
              src={locationInfo.image}
              alt={String(state.location)}
              className="mx-auto mb-6 w-64 max-w-full h-auto rounded-2xl shadow-lg"
            />
          )}

          <h2 className="text-2xl font-bold mb-4">
            {state.location}
          </h2>

          <p className="text-gray-300 mb-6 leading-relaxed">
            {locationInfo.description}
          </p>

          <button
            className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition"
            onClick={() => setIntroStep("done")}
          >
            Continue
          </button>

        </div>
      </div>
    )}

    <TopDashboard
      state={state}
      setPreviewImage={setPreviewImage}
      setShowPersonaCard={setShowPersonaCard}
      setShowLocationCard={setShowLocationCard}
    />

    <div className="max-w-4xl mx-auto p-8">

      {/* Narrative Text Block */}
      <div className="mb-8 p-6 md:p-8 bg-black/50 rounded-3xl shadow-2xl text-base md:text-lg leading-relaxed">
        {displayText}
      </div>

      {/* ================= NARRATIVE ================= */}
      {introStep === "done" && node.type === "narrative" && (
        <button
        className="
          w-auto px-6 py-3
          bg-indigo-600 rounded-xl
          text-base font-semibold
          transition-all duration-300
          hover:bg-indigo-500
          hover:translate-y-[-2px]
          active:translate-y-[1px]
        "
          onClick={() => setState(applyOption(state))}
        >
          {getContinueLabel()}
        </button>
      )}

      {/* ================= DECISION ================= */}
      {introStep === "done" && node.type  === "decision" &&
        "options" in node &&
        Array.isArray(node.options) &&
        node.options.map((option: any) => {

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

  {previewImage && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={() => setPreviewImage(null)}
    >
      <img
        src={previewImage}
        className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
      />
    </div>
  )}

  {showPersonaCard && personaData && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => setShowPersonaCard(false)}
    >
      <div
        className="bg-slate-900 p-8 rounded-3xl max-w-lg w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {personaData.image && (
          <img
            src={personaData.image}
            className="mx-auto mb-6 w-48 rounded-xl"
          />
        )}

        <h2 className="text-2xl font-bold mb-4">
          {state.persona}
        </h2>

        <p className="text-gray-300 leading-relaxed">
          {personaData.description}
        </p>
      </div>
    </div>
  )}

  {showLocationCard && locationInfo && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => setShowLocationCard(false)}
    >
      <div
        className="bg-slate-900 p-8 rounded-3xl max-w-lg w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {locationInfo.image && (
          <img
            src={locationInfo.image}
            className="mx-auto mb-6 w-48 rounded-xl"
          />
        )}

        <h2 className="text-2xl font-bold mb-4">
          {state.location}
        </h2>

        <p className="text-gray-300 leading-relaxed">
          {locationInfo.description}
        </p>
      </div>
    </div>
  )}  

  </div>
</div>
)
}

/* ========================================================= */
/* DASHBOARD */
/* ========================================================= */

function TopDashboard({
  state,
  setPreviewImage,
  setShowPersonaCard,
  setShowLocationCard
}: {
  state: GameState
  setPreviewImage: (src: string) => void
  setShowPersonaCard: (v: boolean) => void
  setShowLocationCard: (v: boolean) => void
}) {

  const personaInfo =
  (gameData as any).persona_info?.[state.persona]

  const locationInfo =
  (gameData as any).location_info?.[state.location]

  const vars = gameData.system.variables

  const riskLevel =
    state.HR === 0
      ? "Stable"
      : state.HR <= 2
      ? "Elevated"
      : "Critical"

  return (
    <div className="relative bg-black/40 backdrop-blur-md border-b border-white/10">

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-1">

      <div className="bg-white/5 p-4 rounded-xl border border-white/10 
                grid grid-cols-2 md:grid-cols-1 gap-4">

{/* Persona Section */}
<div>

  <div className="flex items-center gap-3 mb-2">

    {personaInfo?.image && (
    <img
      src={personaInfo.image}
      alt={String(state.persona)}
      onClick={() => setShowPersonaCard(true)}
      className="w-10 h-10 object-cover rounded-md cursor-pointer hover:scale-110 transition"
    />
  )}

    <span className="inline-block px-5 py-2 bg-indigo-600/30 rounded-full text-base font-semibold">
      {state.persona}
    </span>

  </div>

  {personaInfo?.description && (
  <div className="hidden md:block text-base text-gray-200 leading-relaxed">
    {personaInfo.description}
  </div>
)}

</div>


{/* Location Section */}
<div>

<div className="flex items-center gap-2">

    {locationInfo?.image && (
    <img
      src={locationInfo.image}
      alt={String(state.location)}
      onClick={() => setShowLocationCard(true)}
      className="w-10 h-10 object-cover rounded-md cursor-pointer hover:scale-110 transition"
    />
  )}

    <span className="inline-block px-5 py-2 bg-emerald-600/30 rounded-full text-base font-semibold">
      {state.location}
    </span>

  </div>

  {locationInfo?.description && (
  <div className="hidden md:block text-base text-gray-200 leading-relaxed">
    {locationInfo.description}
  </div>
)}

</div>

</div>

        <div className="bg-white/5 p-1 md:p-1 rounded-xl border border-white/10">

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
          <div className="mt-2 pt-2 md:mt-3 md:pt-3 border-t border-white/20">

            <div className="text-[10px] md:text-xs uppercase tracking-wide text-gray-400 mb-1">
              Hazard Accumulation
            </div>

            <div className="flex justify-between text-sm mb-1">
              <span>High Risk</span>
              <span>{state.HR}</span>
            </div>

            <div className="w-full bg-white/20 h-1.5 md:h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-600 h-full transition-all duration-300"
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
    <div className="mb-1">

      <div className="flex justify-between text-xs md:text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="relative w-full h-1.5 md:h-2 bg-white/10 rounded-full">

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
      <h2 className="text-lg md:text-xl font-semibold mb-3">
        Disaster Literacy Score
      </h2>

      <div className="text-xl md:text-3xl font-bold mb-6">
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