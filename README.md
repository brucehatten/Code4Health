##The Inspiration
The project was inspired by the need to make Type 2 Diabetes education more interactive. Instead of reading lists of drugs, we wanted to create a **"Memory Palace"** using the Method of Loci. By placing medications in a 3D space, learners can use spatial memory to better retain clinical guidelines and drug classifications. To better improve learner engagement and understanding, unique objects/animals have been placed in every scenario/room. Another important factor motivating our team to gamify the project was a meta-analysis of 19 studies showing that gamification positively affects cognitive learning outcomes (knowledge and recall), as well as motivation and behavior, across various educational settings (Sailer & Homner, The Gamification of Learning: A Meta-Analysis).

##How We Built It
We built a virtual simulation environment called **MedLab 3D**.

3D Space: We used a 3D engine to create a laboratory where users can move around in a first-person view.

Patient Simulator: We developed a system that generates a patient profile, including their medical history, vitals, and lab results like HbA1c , FBG, and Blood Glucose.

Interactive Treatment: Users can inspect drug labels on the shelves to see indications and side effects, then "administer" them to the patient.

Feedback System: We built a logic engine that scores the user's treatment plan based on how well it matches the patient’s specific needs and risks.

##Challenges We Faced
Creating the Logic: A major challenge was ensuring the system could correctly identify "correct" treatments versus "trap" treatments based on a patient's specific health data.

Navigation: It was a challenge to make moving and looking around the 3D lab feel natural for the user while they are trying to focus on medical details.

Information Design: We had to find a way to display complex patient charts and drug panels clearly within the 3D world so the user doesn't feel overwhelmed by data.

##Accomplishments
We successfully turned a dry academic subject into a functional game like environment. Seeing the "Administer" logic correctly validate complex drug combinations based on a patient’s specific $HbA1c$ and lab values was a major win.

##What We Learned
We learned that game based Learning makes studying clinical guidelines more engaging. By allowing the user to "Enter the Lab" and make decisions in real time, the simulation reinforces the connection between patient data and treatment choices. We also learned how to integrate 3D visuals with a scoring system to provide immediate, helpful feedback to the learner.

## What's next for MedLab3D 
We plan to implement procedurally generated patients, providing a near infinite variety of lab values and comorbidities for students to solve. Beyond T2DM, we aim to expand the lab into other complex medical fields like Cardiology and Microbiology, and eventually explore non medical topics that require high density data memorization.
