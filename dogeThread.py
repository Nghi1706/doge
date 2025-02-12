import os
import sys
import tkinter as tk
from tkinter import Label, Entry, Button
from playsound import playsound
from crawling import crawlDogeChain,crawlDogeMing, crawWhattomine, crawWhattomineCal, crawUnisat, crawlFractalbitcoin
import multiprocessing

class DogecoinApp(tk.Tk):
    def __init__(self):
        super().__init__()

        # config main windown
        self.title("Dogecoin Mining Tracker")
        self.geometry("650x400")
        self.config(background="gray20")

        # Data Variables
        self.inputDogeMin = tk.DoubleVar(self)
        self.inputDogeMax = tk.DoubleVar(self)
        self.inputDogeCurrent = tk.DoubleVar(self)
        self.inputFees = tk.DoubleVar(self)
        self.profitability_bf = 0
        self.fratabitcoin = 0
        self.firstTimeLoad = True
        self.pool = multiprocessing.Pool(processes=min(6, multiprocessing.cpu_count()))
        self.dataResponse = {'dogechain': [], 'dogeming': [], 'whattomine' : [], 'fratabitcoin' : []} 
        self.dataWhattomineCal = 0
        self.functionCrawling = ['dogechain', 'dogeming', 'whattomine', 'unisat', 'fratabitcoin']
        self.audio_file = self.get_resource_path('notification.mp3')
        self.log_file = self.get_resource_path('log.txt')

        # UI Initialization
        self.create_widgets()
        # Handle Window Close
        self.protocol("WM_DELETE_WINDOW", self.on_closing_pool)
        # Start periodic updates
        self.after(100, self.periodically_called)

    def create_widgets(self):
        """Create UI components and place them in the grid."""
        self.create_profitability_section()
        self.create_whattomine_section()
        self.create_cost_doge_section()
        self.create_unisat_section()
        self.create_BlockDoge_info_section()
        self.checkDissableButton()

    def checkDissableButton(self):
        if self.fratabitcoin == 0:
            self.buttonCal['state'] = tk.DISABLED
        else:
            self.buttonCal['state'] = tk.NORMAL

    def create_profitability_section(self):
        """Creates UI elements for profitability details."""
        headers = ["Profitability", "Mining Diff", "Dogechain Diff", "Response"]
        for i, h in enumerate(headers):
            Label(self, text=h, fg="white", background="gray20").grid(row=0, column=i, padx=10, pady=5)
        # data profit
        self.profitability_data_labels = [Label(self, text="checking", fg="white", background="gray20") for _ in headers]
        for i, lbl in enumerate(self.profitability_data_labels):
            lbl.grid(row=1, column=i, padx=10, pady=5)

    def create_whattomine_section(self):
        """Creates UI elements for whattomine data."""
        header = ['Rev.BTCperDay', 'Calculating', 'Fees', 'Fractal Bitcoin', '']
        for i, h in enumerate(header):
            Label(self, text=h, fg="yellow", background="gray20").grid(row=2, column=i, padx=10, pady=5)
        self.rev_per_day_label = Label(self, text="checking", fg="yellow", background="gray20")
        self.rev_per_day_cal_label = Label(self, text="checking", fg="yellow", background="gray20")
        self.input_Fees = Entry(self, width=10, textvariable=self.inputFees, fg="yellow", background="gray20")
        self.buttonCal = Button(self, text="Calculate", 
                                   font=("Arial", 12, "bold"),  # Chữ đậm
                                   bg="black",  # Màu nền xám đậm
                                   fg="black",  # Màu chữ trắng
                                   relief="flat",  # Xóa viền mặc định
                                   padx=1, pady=1, command=self.buttonCalClicked)
        self.fractalbitcoin_label =  Label(self, text="checking", fg="yellow", background="gray20")
        self.rev_per_day_label.grid(row=3, column=0, padx=10, pady=5)
        self.rev_per_day_cal_label.grid(row=3, column=1, padx=10, pady=5)
        self.input_Fees.grid(row=3, column=2, padx=10, pady=5)
        self.fractalbitcoin_label.grid(row=3, column=3, padx=10, pady=5)
        self.buttonCal.grid(row=3, column=4, padx=10, pady=5)

    def create_cost_doge_section(self):
        # input
        header = ['Giá doge', 'Giá SuperDoge', 'Giá vào lệnh']
        for i, h in enumerate(header):
            Label(self, text=h, fg="firebrick2", background="gray20").grid(row = 4, column=i,padx=10, pady=5)
        inputDogeMin_entry = Entry(self, width = 10, textvariable=self.inputDogeMin, fg='firebrick2', background='gray20')
        inputDogeMax_entry = Entry(self, width = 10, textvariable=self.inputDogeMax, fg='firebrick2', background='gray20')
        inputDogeCurrent_entry = Entry(self, width = 10, textvariable=self.inputDogeCurrent, fg='firebrick2', background='gray20')
        inputDogeMin_entry.grid(row = 5, column= 0,padx=10, pady=5)
        inputDogeMax_entry.grid(row = 5, column= 1,padx=10, pady=5)
        inputDogeCurrent_entry.grid(row = 5, column= 2,padx=10, pady=5)
        # Label
        self.checkDataDogeMin= Label(self, text='checking', fg='firebrick2', background='gray20')
        self.checkDataDogeMax = Label(self, text='checking', fg='firebrick2', background='gray20')
        self.checkDataDogeMin.grid(row = 6, column= 0,padx=10, pady=5)
        self.checkDataDogeMax.grid(row = 6, column= 1,padx=10, pady=5)
    def create_unisat_section(self):
        """Creates UI elements for unisat data."""
        Label(self, text="Unisat", fg="green2", background="gray20").grid(row=7, column=0, padx=10, pady=5)

        self.unisat_labels = [Label(self, text="checking", fg="green2", background="gray20") for _ in range(5)]
        for i, lbl in enumerate(self.unisat_labels):
            lbl.grid(row=8, column=i, padx=10, pady=5)

    def create_BlockDoge_info_section(self):
        """Creates UI elements for block mining info."""
        headers = ["Block", "Time", "Transactions", "Reward", "Size"]
        self.blockDoge_labels = [Label(self, text=h, fg="white", background="gray20") for h in headers]
        for i, lbl in enumerate(self.blockDoge_labels):
            lbl.grid(row=9, column=i, padx=10, pady=5)

        self.blockDoge_data_labels = [Label(self, text="checking", fg="white", background="gray20") for _ in headers]
        for i, lbl in enumerate(self.blockDoge_data_labels):
            lbl.grid(row=10, column=i, padx=10, pady=5)

    @staticmethod
    def sendRequestProcess(crawf):
        if crawf == 'dogechain':
            result = crawlDogeChain()
        elif crawf == 'dogeming':
            result = crawlDogeMing()
        elif crawf == 'unisat':
            result = crawUnisat()
        elif crawf == 'fratabitcoin':
            result = crawlFractalbitcoin()
        else:
            result = crawWhattomine()
        return result
        
    @staticmethod
    def background_task(fractalBCoinDiff, fee):
        result = crawWhattomineCal(fractalBCoinDiff, fee)
        return result

    def buttonCalClicked(self):
        self.buttonCal['state'] = tk.DISABLED
        try:
            self.pool.apply_async(self.background_task,args=(self.fratabitcoin, float(self.inputFees.get())), callback=self.process_result)

        except Exception as e:
            self.buttonCal['state'] = tk.NORMAL
            f = open(self.log_file, 'a')
            f.write("error: " + str(e) + "\n")
            f.close()
            pass

        # button
    def process_result(self, result):
        self.dataWhattomineCal = result
        self.buttonCal['state'] = tk.DISABLED
        self.updateWhattomineCal(result)
        self.update()
        self.update_idletasks()
        self.buttonCal['state'] = tk.NORMAL

    def processResult(self, results):
        self.dataResponse.update(dict(zip(self.functionCrawling, results)))
        self.fratabitcoin = self.dataResponse['fratabitcoin']
        print(self.dataResponse)
        if self.dataResponse['dogechain'][0] == self.dataResponse['dogeming'][1]:
            self.dataResponse['dogeming'][2] = 'Sai Khối'
        try: 
            self.updateUIPprofitAndCostCoin()
            self.updateUIUnisat()
            self.updateBlockDogeInfo()
            self.updateWhattomine()
            self.updateFraltalBitcoin()
        except Exception as e:
            f = open(self.log_file, 'a')
            f.write("error: " + str(e) + "\n")
            f.close()
            pass
        if self.firstTimeLoad :
            self.buttonCal['state'] = tk.NORMAL
            self.firstTimeLoad = False
        self.update()
        self.update_idletasks()
        try:
            self.playSoundChecking(self.profitability_bf, self.dataResponse['dogeming'][0])
        except Exception as e:
            f = open(self.log_file, 'a')
            f.write("error: " + str(e) + "\n")
            f.close()
            pass
        # set profit before  = profit current 
        self.profitability_bf = self.dataResponse['dogeming'][0]

    # update UI Profit and Cost of Coin Playsound
    def updateUIPprofitAndCostCoin(self):
        labels = self.profitability_data_labels 
        # profit
        labels[0]['text'] = self.dataResponse['dogeming'][0]
        # mining Diff
        labels[1]['text'] = self.dataResponse['dogeming'][1]
        # chain Diff
        labels[2]['text'] = self.dataResponse['dogechain'][0]
        # profit response
        labels[3]['text'] = self.dataResponse['dogeming'][2]
        # check data input Doge Cost Min - Max
        self.checkDataDogeMin['text'] = float(self.inputDogeMin.get()) + self.dataResponse['dogeming'][0]
        self.checkDataDogeMax['text'] = float(self.inputDogeMax.get()) + self.dataResponse['dogeming'][0]
    # update UI Unisat
    def updateUIUnisat(self):
        labels = self.unisat_labels
        labels[0]['text'] = self.dataResponse['unisat'][0]
        labels[1]['text'] = self.dataResponse['unisat'][1]
        labels[2]['text'] = self.dataResponse['unisat'][2]
        labels[3]['text'] = self.dataResponse['unisat'][3]
        labels[4]['text'] = self.dataResponse['unisat'][4]

    def updateBlockDogeInfo(self):
        labels = self.blockDoge_data_labels
        labels[0]['text'] = self.dataResponse['dogechain'][1][0]
        labels[1]['text'] = self.dataResponse['dogechain'][1][1]
        labels[2]['text'] = self.dataResponse['dogechain'][1][2]
        labels[3]['text'] = self.dataResponse['dogechain'][1][3]
        labels[4]['text'] = self.dataResponse['dogechain'][1][4]
    def updateWhattomine(self):
        self.rev_per_day_label['text'] = self.dataResponse['whattomine']
    def updateWhattomineCal(self, data):
        self.rev_per_day_cal_label['text'] = str(data)

    def updateFraltalBitcoin(self):
        self.fractalbitcoin_label['text'] = self.dataResponse['fratabitcoin']
    def periodically_called(self):
        """Periodically refreshes data."""
        try:
            self.pool.map_async(self.sendRequestProcess, self.functionCrawling,callback=self.processResult)
            pass
        except Exception as e:
            f = open(self.log_file, 'a')
            f.write("error: " + str(e) + "\n")
            f.close()
            pass
        self.after(10000, self.periodically_called)

    # path to build
    def get_resource_path(self, filename):
        # if run with file .app get this path
        if getattr(sys, 'frozen', False):
            base_path = os.path.join(sys._MEIPASS, "Contents/Resources")
        else:
            base_path = os.path.abspath(".")

        return os.path.join(base_path, filename)
    
    def playSoundChecking(self, profitability_bf, profitability):
        if int(profitability_bf) != int(profitability):
            # profit changed
            if isinstance(float(self.inputDogeMin.get()), float) and isinstance(float(self.inputDogeMax.get()), float) and  isinstance(float(self.inputDogeCurrent.get()), float) and  float(self.inputDogeCurrent.get()) > 0.0:
                if (profitability + float(self.inputDogeMin.get()) > float(self.inputDogeCurrent.get())) or (profitability + float(self.inputDogeMax.get()) > float(self.inputDogeCurrent.get())):
                    # playsound('notification.mp3')
                    playsound(self.audio_file)

    def on_closing_pool(self):
        self.pool.close()
        self.pool.terminate()
        self.pool.join()
        self.destroy()
    def reset_window(self):
        """Clears all widgets and reloads the Tkinter window without closing it."""
        for widget in self.winfo_children():
            widget.destroy()  # Remove all widgets
        self.create_widgets()
if __name__ == "__main__":
    multiprocessing.freeze_support()
    app = DogecoinApp()
    app.mainloop()