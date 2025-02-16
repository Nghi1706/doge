import os
import sys
import tkinter as tk
from tkinter import Label, Entry, Button
from playsound import playsound
from crawling import crawlDogeChain,crawlDogeMing, crawWhattomine, crawWhattomineCal, crawUnisat, crawlFractalbitcoin
import multiprocessing
from functools import partial


class DogecoinApp(tk.Tk):
    def __init__(self):
        super().__init__()

        # config main windown
        self.title("Dogecoin Mining Tracker")
        self.geometry("650x500")
        self.config(background="gray20")

        # Data Variables
        self.inputUserDogeChain = tk.StringVar()
        self.inputCookieDogeChain = tk.StringVar()
        self.inputDogeMin = tk.DoubleVar(self)
        self.inputDogeMax = tk.DoubleVar(self)
        self.inputDogeCurrent = tk.DoubleVar(self)
        self.inputFees = tk.DoubleVar(self)
        self.profitability_bf = 0
        self.fratabitcoin = 0
        self.firstTimeLoad = True
        self.pool = multiprocessing.Pool(processes=min(6, multiprocessing.cpu_count()))
        self.dataResponse = {'dogechain': {}, 'dogeming': {}, 'whattomine' : {}, 'fratabitcoin' : {}} 
        self.dataWhattomineCal = {}
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
        self.create_input_user_password()
        self.checkDissableButton()
        

    def checkDissableButton(self):
        if self.fratabitcoin == 0:
            self.buttonCal['state'] = 'disable'
        else:
            self.buttonCal['state'] = 'normal'

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
                                   fg="white",  # Màu chữ trắng
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
        # resest
        self.buttonResest = Button(self, text="ReLoad", 
                                   font=("Arial", 12, "bold"),  # Chữ đậm
                                   bg="black",  # Màu nền xám đậm
                                   fg="white",  # Màu chữ trắng
                                   relief="flat",  # Xóa viền mặc định
                                   padx=1, pady=1, command=self.reset_window)
        self.buttonResest.grid(row = 5, column= 4,padx=10, pady=5)
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
    def create_input_user_password(self):
        header = ['user', 'cookies']
        for i, h in enumerate(header):
            Label(self, text=h, fg="yellow", background="gray20").grid(row= 11+i, column=0, padx=10, pady=5)
        self.needtoupdateUAC = Label(self, text='Cập nhật user - cookie', fg="yellow", background="gray20")
        self.needtoupdateUAC.grid(row= 11, column=2, padx=10, pady=5)
        inputUser_entry = Entry(self, width = 10, textvariable=self.inputUserDogeChain, fg='yellow', background='gray20')
        inputPassword_entry = Entry(self, width = 10, textvariable= self.inputCookieDogeChain, fg='yellow', background='gray20')
        inputUser_entry.grid(row = 11, column= 1,padx=10, pady=5)
        inputPassword_entry.grid(row = 12, column= 1,padx=10, pady=5)


    @staticmethod
    def sendRequestProcess(crawf  , user_cookies):
        if crawf == 'dogechain':
            result = crawlDogeChain(user_cookies)
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
        self.buttonCal['state'] = 'disable'
        try:
            self.pool.apply_async(self.background_task,args=(self.fratabitcoin, float(self.inputFees.get())), callback=self.process_result)

        except Exception as e:
            self.writeLogError(e)
            pass

        # button
    def process_result(self, result):
        self.dataWhattomineCal = result
        if self.dataWhattomineCal['status']:
            self.buttonCal['state'] = 'disable'
            self.updateWhattomineCal()
            self.update()
            self.update_idletasks()
        else :
            self.writeLogError(self.dataWhattomineCal['response'])
        self.buttonCal['state'] = 'normal'
    def processResult(self, results):
        self.dataResponse.update(dict(zip(self.functionCrawling, results)))
        # print(self.dataResponse)
        
        try: 
            # update ui dogechain and dogeming
            if self.dataResponse['dogechain']['status'] and self.dataResponse['dogeming']['status']:
                if self.dataResponse['dogechain']['response'][0] == self.dataResponse['dogeming']['response'][1]:
                    self.dataResponse['dogeming']['response'][2] = 'Sai Khối'
                self.updateUIPprofitAndCostCoin()
                self.updateBlockDogeInfo()
                self.updateUIUAC('')
                try:
                    self.playSoundChecking(self.profitability_bf, self.dataResponse['dogeming']['response'][0])
                    # set profit before  = profit current 
                    self.profitability_bf = self.dataResponse['dogeming']['response'][0]
                except Exception as e:
                    self.writeLogError(e)
                    pass
            # write log error to control
            else:
                if not self.dataResponse['dogechain']['status']:
                    self.updateUIUAC('Cập nhật user - cookie' )
                    self.writeLogError(self.dataResponse['dogechain']['response'])
                if not self.dataResponse['dogeming']['status']:
                    self.writeLogError(self.dataResponse['dogeming']['response'])
                    
            # update ui Unisat
            if self.dataResponse['unisat']['status']:
                self.updateUIUnisat()
            # write log error to control
            else:
                self.writeLogError(self.dataResponse['unisat']['response'])
            # update ui whattomine
            if self.dataResponse['whattomine']['status']:
                self.updateWhattomine()
            # write log error to control
            else:
                self.writeLogError(self.dataResponse['whattomine']['response'])
            # update ui fratabitcoin
            if self.dataResponse['fratabitcoin']['status']:
                self.fratabitcoin = self.dataResponse['fratabitcoin']['response']
                self.updateFraltalBitcoin()
            # write log error to control
            else:
                self.writeLogError(self.dataResponse['fratabitcoin']['response'])
        except Exception as e:
            self.writeLogError(e)
            pass
        if self.firstTimeLoad :
            self.buttonCal['state'] = 'normal'
            self.firstTimeLoad = False
        self.update()
        self.update_idletasks()



    # update notification input user cookies
    def updateUIUAC(self, text):
        self.needtoupdateUAC['text'] = text
    # update UI Profit and Cost of Coin Playsound
    def updateUIPprofitAndCostCoin(self):
        labels = self.profitability_data_labels 
        # profit
        labels[0]['text'] = self.dataResponse['dogeming']['response'][0]
        # mining Diff
        labels[1]['text'] = self.dataResponse['dogeming']['response'][1]
        # chain Diff
        labels[2]['text'] = self.dataResponse['dogechain']['response'][0]
        # profit response
        labels[3]['text'] = self.dataResponse['dogeming']['response'][2]
        # check data input Doge Cost Min - Max
        self.checkDataDogeMin['text'] = float(self.inputDogeMin.get()) + self.dataResponse['dogeming']['response'][0]
        self.checkDataDogeMax['text'] = float(self.inputDogeMax.get()) + self.dataResponse['dogeming']['response'][0]
    # update UI Unisat
    def updateUIUnisat(self):
        labels = self.unisat_labels
        labels[0]['text'] = self.dataResponse['unisat']['response'][0]
        labels[1]['text'] = self.dataResponse['unisat']['response'][1]
        labels[2]['text'] = self.dataResponse['unisat']['response'][2]
        labels[3]['text'] = self.dataResponse['unisat']['response'][3]
        labels[4]['text'] = self.dataResponse['unisat']['response'][4]

    def updateBlockDogeInfo(self):
        labels = self.blockDoge_data_labels
        labels[0]['text'] = self.dataResponse['dogechain']['response'][1][0]
        labels[1]['text'] = self.dataResponse['dogechain']['response'][1][1]
        labels[2]['text'] = self.dataResponse['dogechain']['response'][1][2]
        labels[3]['text'] = self.dataResponse['dogechain']['response'][1][3]
        labels[4]['text'] = self.dataResponse['dogechain']['response'][1][4]
    def updateWhattomine(self):
        self.rev_per_day_label['text'] = self.dataResponse['whattomine']['response']
    def updateWhattomineCal(self):
        self.rev_per_day_cal_label['text'] = self.dataWhattomineCal['response']

    def updateFraltalBitcoin(self):
        self.fractalbitcoin_label['text'] = self.dataResponse['fratabitcoin']['response']
    def periodically_called(self):
        """Periodically refreshes data."""
        try:
            self.pool.map_async(partial(self.sendRequestProcess, user_cookies=[self.inputUserDogeChain.get(), self.inputCookieDogeChain.get()]) , self.functionCrawling,callback=self.processResult)
            pass
        except Exception as e:
            self.writeLogError(e)
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
    def writeLogError(self, e):
        f = open(self.log_file, 'a')
        f.write("error: " + str(e) + "\n")
        f.close()

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