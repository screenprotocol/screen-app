import 'module-alias/register'
import dotenv from 'dotenv'
import initialiseFirebase from '@/firebase/initialise'

console.log('------ INITIALISING ENV ------')
dotenv.config()

initialiseFirebase()
