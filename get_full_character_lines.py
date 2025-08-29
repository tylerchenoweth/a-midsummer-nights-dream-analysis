import os
import json

with open('midsummer-text.json', 'r') as f:
    play = json.load(f)
    
    # for act in play:
    #     for scene in act:
    #         for line in scene:
    #             print(line)


    curr_character = ""
    dialogue = []
    full_line = ""

    for act in play:
        for scene in play[act]:
            for line in play[act][scene]:
                if(int(line) > 0 and int(act) == 1):
                    if(play[act][scene][line]['speaker'] != curr_character):
                        
                        dialogue.append(full_line)
                        full_line = ""
                        curr_character = play[act][scene][line]['speaker']
                    
                    full_line += play[act][scene][line]['line']
                    
            
    # for line in dialogue:
    #     print('"', line, '",')                
                            

    for act in play:
        for scene in play[act]:
            for line in play[act][scene]:
                if(int(line) > 0 and int(act) == 1):
                    print('"', play[act][scene][line]['line'], '",')