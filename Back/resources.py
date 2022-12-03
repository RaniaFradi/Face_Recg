from flask import render_template, request
from flask_restful import Resource
from keras.models import load_model
import cv2
import numpy as np

face_classifier = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def face_detector(img, size=0.5):

    # Convert image to grayscale
    gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
    faces = face_classifier.detectMultiScale(gray, 1.3, 5)
    if faces == ():
        return img, []

    for (x,y,w,h) in faces:
        cv2.rectangle(img,(x,y),(x+w,y+h),(0,255,255),2)
        roi = img[y:y+h, x:x+w]
        roi = cv2.resize(roi, (224, 224))
    return img, roi


class Prediction(Resource):
    def post(self):
        model = load_model(r'C:\Users\Rania Fradi\Desktop\IF4\S2\PFA\face_rec.h5')

        cap = cv2.VideoCapture(0)
        while True:

            ret, frame = cap.read()

            image, face = face_detector(frame)

            face=np.array(face)
            face=np.expand_dims(face,axis=0)
            if face.shape==(1,0):
                cv2.putText(image,"I don't know", (100, 120), cv2.FONT_HERSHEY_COMPLEX, 1, (255,120,150), 2)
                cv2.imshow('Face Recognition',image)
            else:
                result=model.predict(face)
                if result[0][0] == 1.0:
                    cv2.putText(image,"ZEYNEB", (100, 120), cv2.FONT_HERSHEY_COMPLEX, 1, (255,120,150), 2)
                    cv2.imshow('Face Recognition',image)
                elif result[0][0] == 0.0:
                    cv2.putText(image,"RANIA", (100, 120), cv2.FONT_HERSHEY_COMPLEX, 1, (255,120,150), 2)
                    cv2.imshow('Face Recognition',image)
                else:
                    cv2.putText(image,"Not recognized", (100, 120), cv2.FONT_HERSHEY_COMPLEX, 1, (255,120,150), 2)
                    cv2.imshow('Face Recognition',image)

            if cv2.waitKey(1) == 13: #13 is the Enter Key
                break

        cap.release()
        cv2.destroyAllWindows()

                
        

            


        

        




