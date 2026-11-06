// Synthesized locally. An AudioContext is only created by the sound button's gesture.
export class Ambience {
  private context: AudioContext;
  private master: GainNode;
  private oscillators: OscillatorNode[]=[];
  private disposed=false;
  constructor(){
    this.context=new AudioContext();
    this.master=this.context.createGain();this.master.gain.value=0.065;this.master.connect(this.context.destination);
    [110,164.81,220.2].forEach((frequency,index)=>{
      const oscillator=this.context.createOscillator(),gain=this.context.createGain();
      oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=.045/(index+1);
      oscillator.connect(gain);gain.connect(this.master);oscillator.start();this.oscillators.push(oscillator);
    });
  }
  async resume(){if(!this.disposed)await this.context.resume();}
  async suspend(){if(!this.disposed)await this.context.suspend();}
  chime(index:number){
    if(this.disposed||this.context.state!=='running')return;
    const oscillator=this.context.createOscillator(),gain=this.context.createGain(),now=this.context.currentTime;
    oscillator.frequency.value=[440,493.88,554.37,659.25,880][index%5];
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.12,now+.03);gain.gain.exponentialRampToValueAtTime(.001,now+1.5);
    oscillator.connect(gain);gain.connect(this.master);oscillator.start();oscillator.stop(now+1.6);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.oscillators.forEach(o=>{o.stop();o.disconnect();});this.master.disconnect();void this.context.close();}
}
