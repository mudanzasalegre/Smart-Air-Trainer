import {defaultPhysics,type PhysicsSettings} from './types';
export function validatePhysics(p:PhysicsSettings){return Number.isFinite(p.riderMass)&&p.riderMass>=30&&p.riderMass<=200&&Number.isFinite(p.bikeMass)&&p.bikeMass>=3&&p.bikeMass<=40&&p.crr>=.001&&p.crr<=.03&&p.cda>=.1&&p.cda<=1&&p.rho>=.8&&p.rho<=1.5&&p.efficiency>=.7&&p.efficiency<=1;}
// Longitudinal force balance: m dv/dt = ηP/max(v,0.5) - mg sin(atan(slope))
// - Crr mg cos(atan(slope)) - 0.5 ρ CdA v². Fixed <=100 ms substeps.
export class CyclingPhysicsEngine {
 speed=0;constructor(public settings:PhysicsSettings={...defaultPhysics}){if(!validatePhysics(settings))throw new Error('Parámetros físicos inválidos.');}
 step(power:number,grade:number,seconds:number){if(!Number.isFinite(power)||power<0||power>3000||!Number.isFinite(grade)||Math.abs(grade)>30||!Number.isFinite(seconds)||seconds<0||seconds>60)throw new Error('Entrada física fuera de rango.');let distance=0;const steps=Math.max(1,Math.ceil(seconds/.1)),dt=seconds/steps,p=this.settings,m=p.riderMass+p.bikeMass,theta=Math.atan(grade/100);for(let i=0;i<steps;i++){const v=this.speed,drive=Math.min(1000,p.efficiency*power/Math.max(v,.5)),gravity=m*9.80665*Math.sin(theta),rolling=p.crr*m*9.80665*Math.cos(theta),aero=.5*p.rho*p.cda*v*v,a=Math.max(-5,Math.min(2,(drive-gravity-rolling-aero)/m));this.speed=Math.max(0,Math.min(100/3.6,v+a*dt));distance+=(v+this.speed)/2*dt;}return {speed:this.speed*3.6,distance};}
 reset(){this.speed=0;}
}
