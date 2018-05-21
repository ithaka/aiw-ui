import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'ang-card-sort',
    templateUrl: 'card-sort.component.pug'
})

export class CardSortModal implements OnInit {
    ngOnInit() {
        var owOnload=function(){
        if(-1==document.cookie.indexOf('owInvite')){
            var o = new XMLHttpRequest;
            o.onloadend=function(){
                try{
                    var o=document.getElementById('owInviteSnippet');
                    this.response&&JSON.parse(this.response).active===!0&&(document.cookie='owInvite=Done',setTimeout(function(){o.style.display='block',o['style']['opacity']='1'},2e3))
                }
                catch(e){
    
                }
            },o.open('POST','https://www.optimalworkshop.com/survey_status/optimalsort/48j165va/active'),o.send()
        }
    };
    if(window.addEventListener){
        window.addEventListener('load',function(){
            owOnload();
        });
    }
    else if(window['attachEvent']){
        window['attachEvent']('onload',function(){
            owOnload();
        });
    }} 
}