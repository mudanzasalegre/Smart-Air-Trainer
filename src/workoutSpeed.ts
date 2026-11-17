import {defaultPhysics, type PhysicsSettings} from './routes/types';
import {validatePhysics} from './routes/physics';

export type WorkoutMotion = {source:'measured'|'physics'; physics:PhysicsSettings};
export const defaultWorkoutMotion:WorkoutMotion = {source:'measured', physics:defaultPhysics};

export function validWorkoutMotion(value:unknown):value is WorkoutMotion {
 if (!value || typeof value !== 'object') return false;
 const motion = value as WorkoutMotion;
 return (motion.source === 'measured' || motion.source === 'physics') && !!motion.physics && validatePhysics(motion.physics);
}

export function speedLabel(motion:WorkoutMotion|undefined, demo:boolean) {
 if (motion?.source === 'physics') return demo ? 'Virtual en llano · potencia simulada' : 'Virtual en llano · desde potencia';
 return demo ? 'Velocidad simulada' : 'Velocidad del sensor';
}
