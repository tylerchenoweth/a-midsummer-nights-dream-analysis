import json

data = {}


curr_act = 1
curr_scene = 3
line_counter = 1

if curr_act not in data:
    data[curr_act] = {}
if curr_scene not in data[curr_act]:
    data[curr_act][curr_scene] = {}

data[curr_act][curr_scene][line_counter] = "some text"

line_counter += 1

data[curr_act][curr_scene][line_counter] = "more text"

print(data)