/** In-memory adapter. Future PHP API adapter must implement the same contract. */
import { useSyncExternalStore } from 'react';
import { transition } from '../application/workflowEngine.ts';
import { initialWorkflowState } from '../domain/workflow.ts';
import type { WorkflowAction, WorkflowState } from '../domain/workflow.ts';
export interface WorkflowRepository {
  snapshot(): WorkflowState;
  subscribe(listener:()=>void):()=>void;
  execute(action:WorkflowAction):void;
}
export function createMemoryWorkflowRepository():WorkflowRepository {
  let snapshot=initialWorkflowState();
  const listeners=new Set<()=>void>();
  return {
    snapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return ()=>{listeners.delete(listener);};},
    execute(action){ const next=transition(snapshot,action);snapshot=next;listeners.forEach(listener=>listener()); }
  };
}
/** Shared only across mounted views in this tab; resets on reload. No browser storage or HTTP. */
export const demoWorkflowRepository=createMemoryWorkflowRepository();
export function useDemoWorkflows():WorkflowState {
  return useSyncExternalStore(demoWorkflowRepository.subscribe,demoWorkflowRepository.snapshot,demoWorkflowRepository.snapshot);
}
