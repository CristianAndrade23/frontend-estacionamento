import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  @Output() fazLoginEvent = new EventEmitter();

  login = false;

  constructor() { }

  ngOnInit() {
  }

  fazerLogin() {
    this.login = true;
    this.fazLoginEvent.emit(  this.login);
  }

}
