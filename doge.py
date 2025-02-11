from tkinter import *
from playsound import playsound
from crawling import crawling,crawlingSelenium
import os,sys
from threading import Thread

# ui
# set windown width
root = Tk()
root.geometry('600x400')
root.title('DogeCoin')
root.config(background='gray20')
# data
input1Data = DoubleVar(root)
input2Data = DoubleVar(root)
input3Data = DoubleVar(root)
inputFees = DoubleVar(root)
profitability_bf = int()
difficultMining = int()
threadList = {'threadProfit' : Thread(), 'threadUW' : Thread(), 'threadUWwithFees' : Thread()}
# threading
# threadingGetdata = Thread(target=getDataProfit(), name='getDataProfit')
# threadList['threadProfit'] = threadingGetdata
# threadingGetdataUW = Thread(target=getDataUW(), name='getDataUW')
# threadList['threadUW'] = threadingGetdataUW
# threadingGetdataUWwithFees = Thread(target=getDataUWwithFees(), name='getDataUWwithFees')
# threadList['threadUWwithFees'] = threadingGetdataUWwithFees
# create Threading
def threadingGetdataProfit():
    # threadingGetdata = Thread(target=getDataProfit(), name='getDataProfit')
    # threadList['threadProfit'] = threadingGetdata
    # threadingGetdata.start()
    print(Thread(name='getDataUW').is_alive())
    Thread(target=getDataProfit(), name='getDataProfit').start()

def threadinGetdataUW():
    # threadingGetdataUW = Thread(target=getDataUW(), name='getDataUW')
    # threadList['threadUW'] = threadingGetdataUW
    # threadingGetdataUW.start()
    Thread(target=getDataUW(), name='getDataUW').start()


def threadinGetdataUWwithFees():
    # threadingGetdataUWwithFees = Thread(target=getDataUWwithFees(), name='getDataUWwithFees')
    # threadList['threadUWwithFees'] = threadingGetdataUWwithFees
    # threadingGetdataUWwithFees.start()
    Thread(target=getDataUWwithFees(), name='getDataUWwithFees').start()

# update UI
def updateUIProfit(profitability,difficulty,current_difficulty,responseScreen, dataBlock, profitability_bf):
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
    
def updateUIUW(revPerDay,unitsatName1, unitsatName2,unisatName3, unitsatTransaction, unisatTime):
    label_RevPerDay_data['text'] = str(revPerDay)
    label_unitsat_name1['text'] = unitsatName1
    label_unitsat_name2['text'] = unitsatName2
    label_unitsat_name3['text'] = unisatName3
    label_unitsat_Transaction['text'] = unitsatTransaction
    label_unitsat_Time['text'] = unisatTime
    root.update()
    root.update_idletasks()

def updateUIUWwithFees(revPerDaywithFees):
    label_RevPerDayCal_data['text'] = str(revPerDaywithFees)
    buttonCal['state'] = NORMAL
    root.update()
    root.update_idletasks()

def getDataUW():
    revPerDay,unitsatName1, unitsatName2,unisatName3, unitsatTransaction, unisatTime = crawlingSelenium(0,0,False)
    updateUIUW( revPerDay,unitsatName1, unitsatName2,unisatName3, unitsatTransaction, unisatTime)

def getDataUWwithFees():
    revPerDaywithFees = crawlingSelenium(difficultMining, inputFees.get(), True)
    updateUIUWwithFees(revPerDaywithFees)
def getDataProfit():
    global profitability_bf
    global difficultMining
    profitability,difficulty,current_difficulty,responseScreen, dataBlock = crawling()
    difficultMining = difficulty
    updateUIProfit(profitability,difficulty,current_difficulty,responseScreen, dataBlock, profitability_bf)
    profitability_bf = profitability

def calculate():
    threadinGetdataUWwithFees()
    # threadList['threadUWwithFees'].start()

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




# threading
# threadingGetdata = Thread(target=getDataProfit(), name='getDataProfit')
# threadList['threadProfit'] = threadingGetdata
# threadingGetdataUW = Thread(target=getDataUW(), name='getDataUW')
# threadList['threadUW'] = threadingGetdataUW
# threadingGetdataUWwithFees = Thread(target=getDataUWwithFees(), name='getDataUWwithFees')
# threadList['threadUWwithFees'] = threadingGetdataUWwithFees
def periodically_called():
    try:
        # threadinGetdataUW()
        # threadingGetdataProfit()
        # threadList['threadProfit'].start()
        # threadList['threadUW'].start()
        pass
    except Exception as e:
        f = open(get_resource_path('log.txt'), 'a')
        f.write("error: " + str(e) + "\n")
        f.close()
        pass

    root.after(10000, periodically_called)


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

# table : whattomine
# Label
label_RevPerDay = Label(root, text='Rev.BTCperDay', fg='yellow', background='gray20')
label_RevPerDayCal = Label(root, text='Calculating', fg='yellow', background='gray20')
label_Fees = Label(root, text='Fees', fg='yellow', background='gray20')
# grid
label_RevPerDay.grid(row = 2, column= 0,padx=10, pady=5)
label_RevPerDayCal.grid(row = 2, column= 1,padx=10, pady=5)
label_Fees.grid(row = 2, column= 2,padx=10, pady=5)
# data

# Label
label_RevPerDay_data = Label(root, text='checking', fg='yellow', background='gray20')
label_RevPerDayCal_data = Label(root, text='checking', fg='yellow', background='gray20')
input_Fees = Entry(root, width = 10, textvariable=inputFees, fg='yellow', background='gray20')
buttonCal = Button(root, text='Calulate', fg='white', background='black',command=calculate)
# grid
label_RevPerDay_data.grid(row = 3, column= 0,padx=10, pady=5)
label_RevPerDayCal_data.grid(row = 3, column= 1,padx=10, pady=5)
input_Fees.grid(row = 3, column= 2,padx=10, pady=5)
buttonCal.grid(row = 3, column= 3,padx=10, pady=5)


# table 2 : input and check
# input
input1_label = Label(root, text='Giá doge', fg='firebrick2', background='gray20')
input2_label = Label(root, text='Giá SuperDoge', fg='firebrick2', background='gray20')
input3_label = Label(root, text='Giá vào lệnh', fg='firebrick2', background='gray20')
checkedata = Label(root, text='')
input1_label.grid(row = 4, column= 0,padx=10, pady=5)
input2_label.grid(row = 4, column= 1,padx=10, pady=5)
input3_label.grid(row = 4, column= 2,padx=10, pady=5)
# checkedata.grid(row = 5, column= 3,padx=10, pady=5)
input1_entry = Entry(root, width = 10, textvariable=input1Data, fg='firebrick2', background='gray20')
input2_entry = Entry(root, width = 10, textvariable=input2Data, fg='firebrick2', background='gray20')
input3_entry = Entry(root, width = 10, textvariable=input3Data, fg='firebrick2', background='gray20')
input1_entry.grid(row = 5, column= 0,padx=10, pady=5)
input2_entry.grid(row = 5, column= 1,padx=10, pady=5)
input3_entry.grid(row = 5, column= 2,padx=10, pady=5)
# Label
checkData1 = Label(root, text='checking', fg='firebrick2', background='gray20')
checkData2 = Label(root, text='checking', fg='firebrick2', background='gray20')
checkData1.grid(row = 6, column= 0,padx=10, pady=5)
checkData2.grid(row = 6, column= 1,padx=10, pady=5)

# table : Unisat
# Label
label_unitsat = Label(root, text='Unisat', fg='green2', background='gray20')
# grid
label_unitsat.grid(row = 7, column= 0,padx=10, pady=5)
# data
# Label
label_unitsat_name1 = Label(root, text='checking', fg='green2', background='gray20')
label_unitsat_name2 = Label(root, text='checking', fg='green2', background='gray20')
label_unitsat_name3 = Label(root, text='checking', fg='green2', background='gray20')
label_unitsat_Transaction = Label(root, text='checking', fg='green2', background='gray20')
label_unitsat_Time = Label(root, text='checking', fg='green2', background='gray20')
# grid
label_unitsat_name1.grid(row = 8, column= 0,padx=10, pady=5)
label_unitsat_name2.grid(row = 8, column= 1,padx=10, pady=5)
label_unitsat_name3.grid(row = 8, column= 2,padx=10, pady=5)
label_unitsat_Transaction.grid(row = 8, column= 3,padx=10, pady=5)
label_unitsat_Time.grid(row = 8, column= 4,padx=10, pady=5)


# table 3
# Label
label_block = Label(root, text='Block', fg='white', background='gray20')
label_time = Label(root, text='Time', fg='white', background='gray20')
label_transaction = Label(root, text='Transactions', fg='white', background='gray20')
label_reward = Label(root, text='Reward', fg='white', background='gray20')
label_size = Label(root, text='Size', fg='white', background='gray20')
# Grid
label_block.grid(row = 9, column= 0,padx=10, pady=5)
label_time.grid(row = 9, column= 1,padx=10, pady=5)
label_transaction.grid(row = 9, column= 2,padx=10, pady=5)
label_reward.grid(row = 9, column= 3,padx=10, pady=5)
label_size.grid(row = 9, column= 4,padx=10, pady=5)

# data
label_block_data = Label(root, text='checking', fg='white', background='gray20')
label_time_data = Label(root, text='checking', fg='white', background='gray20')
label_transaction_data = Label(root, text='checking', fg='white', background='gray20')
label_reward_data = Label(root, text='checking', fg='white', background='gray20')
label_size_data = Label(root, text='checking', fg='white', background='gray20')
# Grid
label_block_data.grid(row = 10, column= 0,padx=10, pady=5)
label_time_data.grid(row = 10, column= 1,padx=10, pady=5)
label_transaction_data.grid(row = 10, column= 2,padx=10, pady=5)
label_reward_data.grid(row = 10, column= 3,padx=10, pady=5)
label_size_data.grid(row = 10, column= 4,padx=10, pady=5)

root.after(10, periodically_called)
root.mainloop()