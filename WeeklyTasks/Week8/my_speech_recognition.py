import speech_recognition as sr

recognizer = sr.Recognizer()

def record_audio():
    with sr.Microphone() as source:
        print("Please speak something...")
        audio = recognizer.listen(source)
        print("Recording complete.")
        return audio
    
def recognize_speech(audio):
    try:
        print("Recognizing...")
        text = recognizer.recognize_google(audio)
        print("You said: " + text)
    except sr.UnknownValueError:
        print("Sorry, I could not understand the audio.")
    except sr.RequestError as e:
        print(f"Could not request results; {e}")
if __name__ == "__main__":
    audio = record_audio()
    recognize_speech(audio)