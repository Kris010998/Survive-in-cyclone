import gameData from "../data/gameEngine.json"

/* ===========================
   TYPES
=========================== */

export type LiteracyDetail = {
  id: string
  dimension?: string
  explanation?: string
}

export type GameState = {
  node: string
  persona: string
  location: string

  S: number
  R: number
  M: number
  SC: number
  HR: number

  SA: number
  FM: number
  LA: number

  flags: string[]
  history: { node: string; choice?: string }[]

  outcome?: string
  outcomeDescription?: string

  literacyScore?: number
  literacyDetails?: LiteracyDetail[]
  maxLiteracyScore?: number

  feedbackQueue?: string[]
  routerReturnNode?: string
}

/* ===========================
   UTILS
=========================== */

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function randomKey(obj: Record<string, any>) {
    const keys = Object.keys(obj)
    if (!keys.length) throw new Error("Empty object for randomKey")
    return keys[Math.floor(Math.random() * keys.length)]
  }

function hasFlag(state: GameState, flag: string) {
  return state.flags.includes(flag)
}

function evalCondition(condition: string, state: GameState): boolean {
    try {
      const fn = new Function(
        "S","R","M","SC","SA","FM","LA","HR","flags","location",
        `return (${condition})`
      )
  
      return fn(
        state.S,
        state.R,
        state.M,
        state.SC,
        state.SA,
        state.FM,
        state.LA,
        state.HR,
        state.flags,
        state.location
      )
  
    } catch {
      return false
    }
  }

/* ===========================
   INITIALIZATION
=========================== */

export function getInitialState(): GameState {

  const persona = randomKey(gameData.personas)
  const location = randomKey(gameData.locations)

  const base = gameData.system.initial_values
  const personaDelta =
    gameData.personas[persona]?.delta || {}

  const vars = gameData.system.variables
  const skills = gameData.system.skills

  const state: GameState = {
    node: "DAY0_LOCATION",

    persona,
    location,

    S: clamp(base.S + (personaDelta.S || 0), vars.S.min, vars.S.max),
    R: clamp(base.R + (personaDelta.R || 0), vars.R.min, vars.R.max),
    M: clamp(base.M + (personaDelta.M || 0), vars.M.min, vars.M.max),
    SC: clamp(base.SC + (personaDelta.SC || 0), vars.SC.min, vars.SC.max),
    HR: clamp(base.HR + (personaDelta.HR || 0), vars.HR.min, vars.HR.max),

    SA: clamp(base.SA, skills.SA.min, skills.SA.max),
    FM: clamp(base.FM, skills.FM.min, skills.FM.max),
    LA: clamp(base.LA, skills.LA.min, skills.LA.max),

    flags: [],
    history: [],
    feedbackQueue: []
  }

  return autoRouter(state)
}

/* ===========================
   APPLY DELTA
=========================== */

function applyDelta(state: GameState, delta?: Record<string, number>) {
  if (!delta) return

  const vars = gameData.system.variables
  const skills = gameData.system.skills

  state.S = clamp(state.S + (delta.S || 0), vars.S.min, vars.S.max)
  state.R = clamp(state.R + (delta.R || 0), vars.R.min, vars.R.max)
  state.M = clamp(state.M + (delta.M || 0), vars.M.min, vars.M.max)
  state.SC = clamp(state.SC + (delta.SC || 0), vars.SC.min, vars.SC.max)
  state.HR = clamp(state.HR + (delta.HR || 0), vars.HR.min, vars.HR.max)

  state.SA = clamp(state.SA + (delta.SA || 0), skills.SA.min, skills.SA.max)
  state.FM = clamp(state.FM + (delta.FM || 0), skills.FM.min, skills.FM.max)
  state.LA = clamp(state.LA + (delta.LA || 0), skills.LA.min, skills.LA.max)
}

/* ===========================
   APPLY PROBABILITY
=========================== */

function applyProbability(state: GameState, probability: any[]) {

  if (!probability?.length) return

  const eligible = probability.filter((p: any) => {
    if (!p.condition) return true
    return evalCondition(p.condition, state)
  })

  if (!eligible.length) return

  const roll = Math.random()
  let cumulative = 0

  for (let p of eligible) {
    cumulative += p.chance
    if (roll <= cumulative) {
      applyDelta(state, p.effect)
      return
    }
  }

  applyDelta(state, eligible[eligible.length - 1].effect)
}

/* ===========================
   ROUTER ENGINE
=========================== */

function autoRouter(state: GameState): GameState {

    while (true) {
  
      const node = gameData.nodes[state.node]
      if (!node) return state
  
      /* ================= OUTCOME ================= */
  
      if (node.type === "outcome") {
        calculateOutcome(state)
        return state
      }
  
      /* ================= MULTI ROUTER ================= */
  
      if (node.type === "router_multi") {

        // 防止重复触发
        const routerKey = `ROUTED_${state.node}`
      
        if (state.flags.includes(routerKey)) {
          state.node = node.next_after_feedback
          continue
        }
      
        const matches: string[] = []
      
        for (let c of node.conditions || []) {
          if (c.if && evalCondition(c.if, state)) {
            matches.push(c.next)
          }
        }
      
        if (matches.length === 0) {
          state.node = node.next_after_feedback
          continue
        }
      
        state.flags.push(routerKey)
      
        state.feedbackQueue = matches.slice(1)
        state.routerReturnNode = node.next_after_feedback
        state.node = matches[0]
      
        return state
      }
  
      /* ================= SINGLE ROUTER ================= */
  
      if (node.type === "router") {

        let matched = false
      
        for (let c of node.conditions || []) {
      
          if (c.if && evalCondition(c.if, state)) {
      
            // ⭐ 如果定义了 apply_delta，则执行
            if (c.apply_delta) {
              applyDelta(state, c.apply_delta)
            }
      
            state.node = c.next
            matched = true
            break
          }
        }
      
        if (!matched) {
          state.node = node.default_next
        }
      
        continue
      }
  
      /* ================= NORMAL NODE ================= */
  
      return state
    }
  }


/* ===========================
   OUTCOME
=========================== */

function calculateOutcome(state: GameState) {

  const sorted = [...gameData.outcomes].sort(
    (a, b) => a.priority - b.priority
  )

  for (let rule of sorted) {
    if (evalCondition(rule.condition, state)) {
      state.outcome = rule.result
      state.outcomeDescription = rule.description || ""
      break
    }
  }

  calculateLiteracy(state)
}

/* ===========================
   LITERACY
=========================== */

function calculateLiteracy(state: GameState) {

  let score = 0
  const details: LiteracyDetail[] = []

  gameData.literacy_scoring.rules.forEach((rule: any) => {

    let matched = false

        // 1️⃣ 优先使用 condition
        if (rule.condition) {
        matched = evalCondition(rule.condition, state)
        }

        // 2️⃣ 兼容 JSON 中使用的 "if"
        else if (rule.if) {
        matched = evalCondition(rule.if, state)
        }

        // 3️⃣ 单 flag
        else if (rule.if_flag) {
        matched = state.flags.includes(rule.if_flag)
        }

        // 4️⃣ 任意 flag
        else if (rule.if_any_flag) {
        matched = rule.if_any_flag.some((f: string) =>
            state.flags.includes(f)
        )
        }

    if (matched) {
      score += rule.score
      details.push({
        id: rule.id,
        dimension: rule.dimension,
        explanation: rule.explain_success
      })
    }
  })

  state.literacyScore = score
  state.literacyDetails = details
  state.maxLiteracyScore = gameData.literacy_scoring.max_score
}

/* ===========================
   APPLY OPTION
=========================== */

export function applyOption(
  state: GameState,
  option?: any
): GameState {

  const newState: GameState = {
    ...state,
    flags: [...state.flags],
    history: [...state.history],
    feedbackQueue: [...(state.feedbackQueue || [])]
  }

  const currentNode = gameData.nodes[newState.node]
  if (!currentNode) return newState

  /* FEEDBACK CHAIN */
  if (newState.feedbackQueue?.length) {

    const next = newState.feedbackQueue.shift()
  
    if (next) {
      newState.node = next
      return newState
    }
  
    if (newState.routerReturnNode) {
      newState.node = newState.routerReturnNode
      newState.routerReturnNode = undefined   // ⭐ 关键修复
    } else {
      return newState
    }
  
    newState.feedbackQueue = []
    return autoRouter(newState)
  }

  /* NARRATIVE */
  if (currentNode.type === "narrative") {

    newState.history.push({ node: state.node })
  
    if (currentNode.next_by_location) {
      newState.node =
        currentNode.next_by_location[newState.location]
    } else {
      newState.node = currentNode.next
    }
  
    return autoRouter(newState)
  }

  /* DECISION */
  if (currentNode.type === "decision") {

    if (!option) return newState

    if (option.requires_flag &&
        !hasFlag(newState, option.requires_flag)) {
      return newState
    }

    if (option.requires_value) {
      for (let key in option.requires_value) {
        const rule = option.requires_value[key]
        if (rule.min !== undefined &&
            newState[key as keyof GameState] < rule.min) {
          return newState
        }
        if (rule.max !== undefined &&
            newState[key as keyof GameState] > rule.max) {
          return newState
        }
      }
    }

    newState.history.push({
      node: state.node,
      choice: option.id
    })

    applyDelta(newState, option.delta)

    const override =
      option.persona_overrides?.[newState.persona]

    // persona delta
    if (override?.delta) {
        applyDelta(newState, override.delta)
      }
  
      /* ========= 修正后的概率覆盖逻辑 ========= */
  
      if (override?.probability) {
        applyProbability(newState, override.probability)
      } else if (option.probability) {
        applyProbability(newState, option.probability)
      }

    if (option.flag) {
      const flags = Array.isArray(option.flag)
        ? option.flag
        : [option.flag]

      flags.forEach((f: string) => {
        if (!newState.flags.includes(f)) {
          newState.flags.push(f)
        }
      })
    }

    newState.node = option.next
    return autoRouter(newState)
  }

  return newState
}