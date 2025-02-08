from tkinter import *
from playsound import playsound
from crawling import crawling
import os,sys
from threading import Thread


# data
root = Tk()
input1Data = DoubleVar(root)
input2Data = DoubleVar(root)
input3Data = DoubleVar(root)
profitability_bf = int()

# create Threading

def threadingGetdata():
    Thread(target=getData(), name='getData Screen')

def getData():
    global profitability_bf
    profitability,difficulty,current_difficulty,responseScreen, dataBlock = crawling()
    updateUI(profitability,difficulty,current_difficulty,responseScreen, dataBlock, profitability_bf)
    profitability_bf = profitability


# path to build
def get_resource_path(filename):
    # if run with file .app get this path
    if getattr(sys, 'frozen', False):
        base_path = os.path.join(sys._MEIPASS, "Contents/Resources")
    else:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, filename)

def playSoundChecking(profitability_bf, profitability):
    if int(profitability_bf) != int(profitability):
        # profit changed
        if isinstance(float(input1Data.get()), float) and isinstance(float(input2Data.get()), float) and  isinstance(float(input3Data.get()), float) and  float(input3Data.get()) > 0.0:
            if (profitability + float(input1Data.get()) > float(input3Data.get())) or (profitability + float(input2Data.get()) > float(input3Data.get())):
                # playsound('notification.mp3')
                audio_file = get_resource_path("notification.mp3")
                playsound(audio_file)

def updateUI(profitability,difficulty,current_difficulty,responseScreen, dataBlock, profitability_bf):
    label_profitability_data['text'] = str(profitability)
    label_difficulty_data['text'] = difficulty
    label_current_difficulty_data['text'] = current_difficulty
    label_auto_response_data['text'] = responseScreen
    label_block_data['text'] = dataBlock[0]
    label_time_data['text'] = dataBlock[1] + ' ago'
    label_transaction_data['text'] = dataBlock[2]
    label_reward_data['text'] = dataBlock[3]
    label_size_data['text'] = dataBlock[4]
    checkData1['text'] = profitability + float(input1Data.get())
    checkData2['text'] = profitability+ float(input2Data.get())
    root.update()
    root.update_idletasks()
    playSoundChecking(profitability_bf, profitability)

def periodically_called():
    try:
        threadingGetdata()
        pass
    except Exception as e:
        f = open(get_resource_path('log.txt'), 'a')
        f.write("error: " + str(e) + "\n")
        f.close()
        pass

    root.after(10000, periodically_called)


# ui
# set windown width
root.geometry('600x400')
root.title('DogeCoin')
root.config(background='gray20')

# table 1

# Label
label_profitability = Label(root, text='Profitability', fg='white', background='gray20')
label_difficulty = Label(root, text='Mining Diff', fg='white', background='gray20')
label_current_difficulty = Label(root, text='Dogechain Diff', fg='white', background='gray20')
label_auto_response = Label(root, text='Response', fg='white', background='gray20')
# Grid
label_profitability.grid(row = 0, column= 0,padx=10, pady=5)
label_difficulty.grid(row = 0, column= 1,padx=10, pady=5)
label_current_difficulty.grid(row = 0, column= 2,padx=10, pady=5)
label_auto_response.grid(row = 0, column= 3,padx=10, pady=5)
# data
label_profitability_data = Label(root, text='checking', fg='white', background='gray20')
label_difficulty_data = Label(root, text='checking', fg='white', background='gray20')
label_current_difficulty_data = Label(root, text='checking', fg='white', background='gray20')
label_auto_response_data = Label(root, text='checking', fg='white', background='gray20')

label_profitability_data.grid(row = 1, column= 0,padx=10, pady=5)
label_difficulty_data.grid(row = 1, column= 1,padx=10, pady=5)
label_current_difficulty_data.grid(row = 1, column= 2,padx=10, pady=5)
label_auto_response_data.grid(row = 1, column= 3,padx=10, pady=5)

# spacing
# none label
Label(root, text='', fg='white', background='gray20').grid(row = 2, column= 0,padx=15, pady=15)

# table 2 : input and check
# input
input1_label = Label(root, text='Giá doge', fg='white', background='gray20')
input2_label = Label(root, text='Giá SuperDoge', fg='white', background='gray20')
input3_label = Label(root, text='Giá vào lệnh', fg='white', background='gray20')
checkedata = Label(root, text='')
input1_label.grid(row = 3, column= 0,padx=10, pady=5)
input2_label.grid(row = 3, column= 1,padx=10, pady=5)
input3_label.grid(row = 3, column= 2,padx=10, pady=5)
# checkedata.grid(row = 5, column= 3,padx=10, pady=5)
input1_entry = Entry(root, width = 10, textvariable=input1Data, fg='white', background='gray20')
input2_entry = Entry(root, width = 10, textvariable=input2Data, fg='white', background='gray20')
input3_entry = Entry(root, width = 10, textvariable=input3Data, fg='white', background='gray20')
input1_entry.grid(row = 4, column= 0,padx=10, pady=5)
input2_entry.grid(row = 4, column= 1,padx=10, pady=5)
input3_entry.grid(row = 4, column= 2,padx=10, pady=5)
# Label
checkData1 = Label(root, text='checking', fg='white', background='gray20')
checkData2 = Label(root, text='checking', fg='white', background='gray20')
checkData1.grid(row = 5, column= 0,padx=10, pady=5)
checkData2.grid(row = 5, column= 1,padx=10, pady=5)

# spacing
# none label
Label(root, text='', fg='white', background='gray20').grid(row = 6, column= 0,padx=15, pady=15)


# table 3
# Label
label_block = Label(root, text='Block', fg='white', background='gray20')
label_time = Label(root, text='Time', fg='white', background='gray20')
label_transaction = Label(root, text='Transactions', fg='white', background='gray20')
label_reward = Label(root, text='Reward', fg='white', background='gray20')
label_size = Label(root, text='Size', fg='white', background='gray20')
# Grid
label_block.grid(row = 7, column= 0,padx=10, pady=5)
label_time.grid(row = 7, column= 1,padx=10, pady=5)
label_transaction.grid(row = 7, column= 2,padx=10, pady=5)
label_reward.grid(row = 7, column= 3,padx=10, pady=5)
label_size.grid(row = 7, column= 4,padx=10, pady=5)

# data
label_block_data = Label(root, text='checking', fg='white', background='gray20')
label_time_data = Label(root, text='checking', fg='white', background='gray20')
label_transaction_data = Label(root, text='checking', fg='white', background='gray20')
label_reward_data = Label(root, text='checking', fg='white', background='gray20')
label_size_data = Label(root, text='checking', fg='white', background='gray20')
# Grid
label_block_data.grid(row = 8, column= 0,padx=10, pady=5)
label_time_data.grid(row = 8, column= 1,padx=10, pady=5)
label_transaction_data.grid(row = 8, column= 2,padx=10, pady=5)
label_reward_data.grid(row = 8, column= 3,padx=10, pady=5)
label_size_data.grid(row = 8, column= 4,padx=10, pady=5)

root.after(10, periodically_called)
root.mainloop()