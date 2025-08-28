import json

curr_act = 0
curr_scene = 1
curr_line = 0
curr_stage_dir = 0
curr_speaker = ""

json_text = {}

with open('midsummer-text.txt', 'r') as file:
    
    for line in file:
        if(line[0:3] == "ACT"):
            curr_act += 1
            curr_scene = 0
            if(curr_act not in json_text):
                json_text[curr_act] = {}
             
        # Dont do anything until the first act begins   
        elif(curr_act == 0):
            continue
        
        elif(line[0:5] == "SCENE"):
            curr_scene += 1
            if(curr_scene not in json_text[curr_act]):
                json_text[curr_act][curr_scene] = {}
               
        # Dont do anything until the first scene of an act begins
        elif(curr_scene == 0):
            continue
                
        # Get stage directions
        elif(line[0:2] == " [" or line[0:6] == " Enter"):
            # Decrement stage direction lines
            curr_stage_dir -= 1
            if(curr_stage_dir not in json_text[curr_act][curr_scene]):
                json_text[curr_act][curr_scene][curr_stage_dir] = line.strip()
            
        # All uppercase means a character is speaking
        elif(line.strip().isupper()):
            curr_speaker = line.strip()

        # If a character is speaking, add their line
        else:
            # checks for empty lines
            if(line.strip() != ""):
                curr_line += 1
                if(curr_line not in json_text[curr_act][curr_scene]):
                    json_text[curr_act][curr_scene][curr_line] = {"speaker": curr_speaker, "line": line.strip()}


# print(json.dumps(json_text, indent=4))

with open('midsummer-text.json', 'w') as json_file:
    json.dump(json_text, json_file, indent=4)