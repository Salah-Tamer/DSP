import sounddevice as sd
import soundfile as sf
import numpy as np
import matplotlib.pyplot as plt



file_path = r"C:\Users\CRIZMA MEGA STORE\Downloads\60s-rock-beat-music-loop-120-bpm.wav/60s-rock-beat-music-loop-120-bpm.wav.wav"



def read_audio(file_path):
    data, samplerate = sf.read(file_path)
    print(f"Sample Rate: {samplerate} Hz")
    print(f"Number of Channels: {data.shape[1] if len(data.shape) > 1 else 1}")
    print(f"Duration: {len(data) / samplerate:.2f} seconds")
    return data, samplerate



def play_audio(data, samplerate):
    print("Playing audio...")
    sd.play(data, samplerate)
    sd.wait()



def save_audio(file_path, data, samplerate):
    sf.write(file_path, data, samplerate)
    print(f"Audio saved to: {file_path}")



def plot_audio(data, samplerate):
    plt.figure(figsize=(10, 5))
    time = np.linspace(0, len(data) / samplerate, num=len(data))
    plt.plot(time, data)
    plt.title("Audio Signal")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.grid()
    plt.show()



if __name__ == "__main__":

    data, samplerate = read_audio(file_path)

    play_audio(data, samplerate)

    plot_audio(data, samplerate)

