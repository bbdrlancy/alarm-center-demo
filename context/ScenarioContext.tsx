"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

import {
  scenarios,
  ScenarioKey,
} from "@/data/scenarios";

interface ScenarioContextType {
  scenarioKey: ScenarioKey;

  scenario: typeof scenarios.power;

  setScenario: (key: ScenarioKey) => void;

  nextScenario: () => void;
}

const ScenarioContext =
  createContext<ScenarioContextType | null>(null);

const scenarioOrder: ScenarioKey[] = [
  "power",
  "cooling",
  "storage",
  "network",
];

export function ScenarioProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [scenarioKey, setScenarioKey] =
    useState<ScenarioKey>("power");

  const scenario = useMemo(() => {
    return scenarios[scenarioKey];
  }, [scenarioKey]);

  const nextScenario = () => {
    const currentIndex =
      scenarioOrder.indexOf(scenarioKey);

    const nextIndex =
      (currentIndex + 1) %
      scenarioOrder.length;

    setScenarioKey(
      scenarioOrder[nextIndex]
    );
  };

  return (
    <ScenarioContext.Provider
      value={{
        scenarioKey,
        scenario,
        setScenario: setScenarioKey,
        nextScenario,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context =
    useContext(ScenarioContext);

  if (!context) {
    throw new Error(
      "useScenario must be used inside ScenarioProvider"
    );
  }

  return context;
}